import { DatabaseSync } from "node:sqlite";
import { asUUID, parseGraphValue, parseTransactionInput, stableJson, stableTransactionFingerprint } from "@logseq-ts/domain";
import type { GraphValue, TransactionAssertion, TransactionInput, UUID } from "@logseq-ts/domain";
import type { Datom, GraphDatabase, GraphDatabaseOptions, GraphEntityProjection, GraphMigration, ListenerFailure, PullResult, TxReport } from "./contracts.js";

const baseSchema = `
CREATE TABLE IF NOT EXISTS graph_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS graph_schema_migrations (version INTEGER PRIMARY KEY, name TEXT NOT NULL, applied_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS graph_entities_v1 (id INTEGER PRIMARY KEY AUTOINCREMENT, uuid TEXT NOT NULL UNIQUE, created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS graph_attributes_v1 (id INTEGER PRIMARY KEY AUTOINCREMENT, ident TEXT NOT NULL UNIQUE);
CREATE TABLE IF NOT EXISTS graph_transactions_v1 (id INTEGER PRIMARY KEY AUTOINCREMENT, operation_uuid TEXT NOT NULL UNIQUE, fingerprint TEXT NOT NULL, revision INTEGER NOT NULL, source TEXT NOT NULL, metadata_json TEXT NOT NULL, committed_at INTEGER NOT NULL, report_json TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS graph_datoms_v1 (id INTEGER PRIMARY KEY AUTOINCREMENT, entity_id INTEGER NOT NULL, attribute_id INTEGER NOT NULL, value_json TEXT NOT NULL, value_key TEXT NOT NULL, tx_id INTEGER NOT NULL, added INTEGER NOT NULL CHECK (added IN (0, 1)), FOREIGN KEY(entity_id) REFERENCES graph_entities_v1(id), FOREIGN KEY(attribute_id) REFERENCES graph_attributes_v1(id), FOREIGN KEY(tx_id) REFERENCES graph_transactions_v1(id));
CREATE TABLE IF NOT EXISTS graph_current_facts_v1 (entity_id INTEGER NOT NULL, attribute_id INTEGER NOT NULL, value_key TEXT NOT NULL, datom_id INTEGER NOT NULL, PRIMARY KEY(entity_id, attribute_id, value_key), FOREIGN KEY(datom_id) REFERENCES graph_datoms_v1(id));
CREATE INDEX IF NOT EXISTS graph_datoms_v1_tx ON graph_datoms_v1(tx_id);
CREATE INDEX IF NOT EXISTS graph_current_facts_v1_entity ON graph_current_facts_v1(entity_id);`;

interface EntityRow { readonly id: number; readonly uuid?: UUID; }
interface OperationRow { readonly fingerprint: string; readonly report_json: string; }
interface FactRow { readonly ident: string; readonly value_json: string; }

class SqliteGraphDatabase implements GraphDatabase {
  private readonly db: DatabaseSync;
  private readonly listeners = new Set<(report: TxReport) => void | Promise<void>>();
  private readonly failures: ListenerFailure[] = [];
  private isClosed = false;

  constructor(private readonly options: GraphDatabaseOptions) {
    this.db = new DatabaseSync(options.path);
    this.db.exec("PRAGMA foreign_keys = ON");
    this.initialize();
  }

  get revision(): number { return Number(this.meta("revision")); }
  get schemaVersion(): number { return Number(this.meta("schema_version")); }
  get listenerFailures(): readonly ListenerFailure[] { return freeze([...this.failures]); }

  async transact(input: unknown): Promise<TxReport> {
    this.assertOpen();
    const raw = parseTransactionInput(input);
    const fingerprint = stableTransactionFingerprint(raw);
    const prior = this.db.prepare("SELECT fingerprint, report_json FROM graph_transactions_v1 WHERE operation_uuid = ?").get(raw.operationId) as OperationRow | undefined;
    if (prior) {
      if (prior.fingerprint !== fingerprint) throw new Error(`operationId ${raw.operationId} was already used with different input`);
      return freeze(JSON.parse(prior.report_json) as TxReport);
    }
    const parsed = allocateEntityUuids(raw, this.options.uuid);
    this.validateAssertions(parsed);
    let report: TxReport;
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const revision = this.revision + 1;
      const inserted = this.db.prepare("INSERT INTO graph_transactions_v1 (operation_uuid, fingerprint, revision, source, metadata_json, committed_at, report_json) VALUES (?, ?, ?, ?, ?, ?, ?)").run(parsed.operationId, fingerprint, revision, parsed.source, stableJson(parsed.metadata ?? {}), this.options.clock.now(), "{}");
      const txId = Number(inserted.lastInsertRowid);
      report = freeze({ txId, operationId: parsed.operationId, revision, datoms: canonicalDatoms(this.applyAssertions(parsed.assertions, txId)) });
      this.db.prepare("UPDATE graph_transactions_v1 SET report_json = ? WHERE id = ?").run(JSON.stringify(report), txId);
      this.db.prepare("UPDATE graph_meta SET value = ? WHERE key = 'revision'").run(String(revision));
      this.db.exec("COMMIT");
    } catch (error) { this.rollback(); throw error; }
    await this.notify(report!);
    return report!;
  }

  async pull(pattern: unknown, entity: unknown): Promise<PullResult> {
    this.assertOpen();
    const uuid = asUUID(entity);
    const requested = parsePattern(pattern);
    const found = this.db.prepare("SELECT id FROM graph_entities_v1 WHERE uuid = ?").get(uuid) as EntityRow | undefined;
    if (!found) return freeze({ status: "absent", uuid });
    return freeze({ status: "found", entity: this.project(found.id, uuid, requested) });
  }

  async scan(pattern: unknown): Promise<readonly GraphEntityProjection[]> {
    this.assertOpen();
    const requested = parsePattern(pattern);
    const entities = this.db.prepare("SELECT id, uuid FROM graph_entities_v1 ORDER BY uuid ASC").all() as unknown as EntityRow[];
    return freeze(entities.map(entity => this.project(entity.id, entity.uuid!, requested)));
  }

  subscribePostCommit(listener: (report: TxReport) => void | Promise<void>): () => void { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  applyMigrations(migrations: readonly GraphMigration[]): void {
    this.assertOpen();
    const ordered = [...migrations].sort((a, b) => a.version - b.version);
    if (ordered.some((migration, index) => index > 0 && migration.version === ordered[index - 1]?.version)) throw new Error("Duplicate migration version");
    for (const migration of ordered) {
      if (!Number.isInteger(migration.version) || migration.version <= this.schemaVersion) continue;
      if (migration.version !== this.schemaVersion + 1) throw new Error("Migrations must be contiguous");
      this.db.exec("BEGIN IMMEDIATE");
      try {
        migration.apply();
        this.db.prepare("INSERT INTO graph_schema_migrations (version, name, applied_at) VALUES (?, ?, ?)").run(migration.version, migration.name, this.options.clock.now());
        this.db.prepare("UPDATE graph_meta SET value = ? WHERE key = 'schema_version'").run(String(migration.version));
        this.db.exec("COMMIT");
      } catch (error) { this.rollback(); throw error; }
    }
  }
  async close(): Promise<void> { if (!this.isClosed) { this.db.close(); this.isClosed = true; } }

  private initialize(): void {
    this.db.exec("BEGIN IMMEDIATE");
    try {
      this.db.exec(baseSchema);
      this.db.prepare("INSERT OR IGNORE INTO graph_meta (key, value) VALUES ('revision', '0')").run();
      this.db.prepare("INSERT OR IGNORE INTO graph_meta (key, value) VALUES ('schema_version', '1')").run();
      this.db.prepare("INSERT OR IGNORE INTO graph_schema_migrations (version, name, applied_at) VALUES (1, 'base-eav', ?)").run(this.options.clock.now());
      this.db.exec("COMMIT");
    } catch (error) { this.rollback(); this.db.close(); throw error; }
  }
  private validateAssertions(input: TransactionInput): void {
    const created = new Set<string>();
    for (const assertion of input.assertions) if (assertion.kind === "entity.create") {
      const uuid = assertion.uuid!;
      asUUID(uuid);
      if (created.has(uuid) || this.entityId(uuid) !== undefined) throw new Error(`Entity UUID already exists: ${uuid}`);
      created.add(uuid);
    }
    for (const assertion of input.assertions) if (assertion.kind !== "entity.create") {
      if (!created.has(assertion.entity) && this.entityId(assertion.entity) === undefined) throw new Error(`Entity does not exist: ${assertion.entity}`);
      if (isEntityValue(assertion.value) && !created.has(assertion.value.uuid) && this.entityId(assertion.value.uuid) === undefined) throw new Error(`Referenced entity does not exist: ${assertion.value.uuid}`);
    }
  }
  private applyAssertions(assertions: readonly TransactionAssertion[], txId: number): Datom[] {
    const created = new Map<string, number>(); const datoms: Datom[] = [];
    for (const assertion of assertions) if (assertion.kind === "entity.create") {
      const uuid = assertion.uuid!;
      created.set(uuid, Number(this.db.prepare("INSERT INTO graph_entities_v1 (uuid, created_at) VALUES (?, ?)").run(uuid, this.options.clock.now()).lastInsertRowid));
    }
    for (const assertion of assertions) if (assertion.kind !== "entity.create") {
      const entityId = created.get(assertion.entity) ?? this.entityId(assertion.entity);
      if (entityId === undefined) throw new Error(`Entity does not exist: ${assertion.entity}`);
      this.db.prepare("INSERT OR IGNORE INTO graph_attributes_v1 (ident) VALUES (?)").run(assertion.attribute);
      const attributeId = (this.db.prepare("SELECT id FROM graph_attributes_v1 WHERE ident = ?").get(assertion.attribute) as unknown as EntityRow).id;
      if (assertion.kind === "fact.replace") {
        const priorValues = this.db.prepare("SELECT d.value_json, c.value_key FROM graph_current_facts_v1 c JOIN graph_datoms_v1 d ON d.id = c.datom_id WHERE c.entity_id = ? AND c.attribute_id = ? ORDER BY c.value_key ASC").all(entityId, attributeId) as unknown as { value_json: string; value_key: string }[];
        for (const prior of priorValues) this.retractFact(entityId, attributeId, assertion.entity, assertion.attribute, parseGraphValue(JSON.parse(prior.value_json)), prior.value_key, txId, datoms);
        this.setFact(entityId, attributeId, assertion.entity, assertion.attribute, assertion.value, txId, datoms);
      } else {
        const valueJson = stableJson(assertion.value);
        const prior = this.db.prepare("SELECT datom_id FROM graph_current_facts_v1 WHERE entity_id = ? AND attribute_id = ? AND value_key = ?").get(entityId, attributeId, valueJson) as { datom_id: number } | undefined;
        if (assertion.kind === "fact.set" && !prior) this.setFact(entityId, attributeId, assertion.entity, assertion.attribute, assertion.value, txId, datoms);
        else if (assertion.kind === "fact.retract" && prior) this.retractFact(entityId, attributeId, assertion.entity, assertion.attribute, assertion.value, valueJson, txId, datoms);
      }
    }
    return datoms;
  }
  private project(entityId: number, uuid: UUID, requested: { readonly all: boolean; readonly names: ReadonlySet<string> }): GraphEntityProjection {
    const rows = this.db.prepare("SELECT a.ident, d.value_json FROM graph_current_facts_v1 c JOIN graph_datoms_v1 d ON d.id = c.datom_id JOIN graph_attributes_v1 a ON a.id = c.attribute_id WHERE c.entity_id = ? ORDER BY a.ident ASC, d.value_key ASC").all(entityId) as unknown as FactRow[];
    const attributes: Record<string, GraphValue[]> = {};
    for (const row of rows) if (requested.all || requested.names.has(row.ident)) (attributes[row.ident] ??= []).push(parseGraphValue(JSON.parse(row.value_json)));
    return { uuid, attributes };
  }
  private setFact(entityId: number, attributeId: number, entity: UUID, attribute: string, value: GraphValue, txId: number, datoms: Datom[]): void {
    const valueJson = stableJson(value);
    const datomId = Number(this.db.prepare("INSERT INTO graph_datoms_v1 (entity_id, attribute_id, value_json, value_key, tx_id, added) VALUES (?, ?, ?, ?, ?, 1)").run(entityId, attributeId, valueJson, valueJson, txId).lastInsertRowid);
    this.db.prepare("INSERT INTO graph_current_facts_v1 (entity_id, attribute_id, value_key, datom_id) VALUES (?, ?, ?, ?)").run(entityId, attributeId, valueJson, datomId);
    datoms.push({ entity, attribute, value, txId, added: true });
  }
  private retractFact(entityId: number, attributeId: number, entity: UUID, attribute: string, value: GraphValue, valueKey: string, txId: number, datoms: Datom[]): void {
    this.db.prepare("INSERT INTO graph_datoms_v1 (entity_id, attribute_id, value_json, value_key, tx_id, added) VALUES (?, ?, ?, ?, ?, 0)").run(entityId, attributeId, stableJson(value), valueKey, txId);
    this.db.prepare("DELETE FROM graph_current_facts_v1 WHERE entity_id = ? AND attribute_id = ? AND value_key = ?").run(entityId, attributeId, valueKey);
    datoms.push({ entity, attribute, value, txId, added: false });
  }
  private entityId(uuid: string): number | undefined { return (this.db.prepare("SELECT id FROM graph_entities_v1 WHERE uuid = ?").get(uuid) as EntityRow | undefined)?.id; }
  private meta(key: string): string { return (this.db.prepare("SELECT value FROM graph_meta WHERE key = ?").get(key) as { value: string }).value; }
  private rollback(): void { try { this.db.exec("ROLLBACK"); } catch { /* no transaction is open */ } }
  private assertOpen(): void { if (this.isClosed) throw new Error("Graph database is closed"); }
  private async notify(report: TxReport): Promise<void> { let index = 0; for (const listener of this.listeners) { try { await listener(report); } catch (error) { this.failures.push(freeze({ operationId: report.operationId, listenerIndex: index, message: error instanceof Error ? error.message : String(error) })); } index++; } }
}

function parsePattern(pattern: unknown): { readonly all: boolean; readonly names: ReadonlySet<string> } { if (!Array.isArray(pattern) || pattern.some(value => typeof value !== "string" || value.length === 0)) throw new Error("Pull pattern must be an attribute array"); return { all: pattern.includes("*"), names: new Set(pattern) }; }
function allocateEntityUuids(input: TransactionInput, generator: GraphDatabaseOptions["uuid"]): TransactionInput {
  const assertions = input.assertions.map(assertion => assertion.kind === "entity.create" && assertion.uuid === undefined ? { kind: "entity.create" as const, uuid: asUUID(generator.next()) } : assertion);
  return input.metadata === undefined ? { ...input, assertions } : { ...input, assertions };
}
function isEntityValue(value: GraphValue): value is { readonly type: "entity"; readonly uuid: UUID } { return typeof value === "object" && value !== null && value.type === "entity"; }
function canonicalDatoms(datoms: readonly Datom[]): readonly Datom[] { return datoms.slice().sort((a, b) => a.entity.localeCompare(b.entity) || a.attribute.localeCompare(b.attribute) || stableJson(a.value).localeCompare(stableJson(b.value)) || Number(a.added) - Number(b.added)); }
function freeze<T>(value: T): T { if (value && typeof value === "object" && !Object.isFrozen(value)) { for (const child of Object.values(value as Record<string, unknown>)) freeze(child); Object.freeze(value); } return value; }

export function createGraphDatabase(options: GraphDatabaseOptions): GraphDatabase { return new SqliteGraphDatabase(options); }
export * from "./contracts.js";
