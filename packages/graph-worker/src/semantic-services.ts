import { randomUUID } from "node:crypto";
import { createGraphDatabase } from "@tessera-ts/graph-db";
import { z } from "zod";

const uuid = z.uuid();
const value = z.discriminatedUnion("type", [
  z.strictObject({ type: z.literal("text"), value: z.string() }),
  z.strictObject({ type: z.literal("number"), value: z.number().finite() }),
  z.strictObject({ type: z.literal("checkbox"), value: z.boolean() }),
  z.strictObject({ type: z.literal("date"), value: z.string() }),
  z.strictObject({ type: z.literal("datetime"), value: z.string() }),
  z.strictObject({ type: z.literal("url"), value: z.string() }),
  z.strictObject({ type: z.literal("node"), value: uuid })
]);
const commandSchema = z.discriminatedUnion("kind", [
  z.strictObject({ kind: z.literal("property.define"), operationId: uuid, uuid, name: z.string().min(1), type: z.enum(["text", "number", "date", "datetime", "checkbox", "url", "node"]), cardinality: z.enum(["one", "many"]) }),
  z.strictObject({ kind: z.literal("property.set"), operationId: uuid, entity: uuid, property: uuid, values: z.array(value).min(1) }),
  z.strictObject({ kind: z.literal("class.define"), operationId: uuid, uuid, name: z.string().min(1), properties: z.array(uuid).default([]), parents: z.array(uuid).default([]) }),
  z.strictObject({ kind: z.literal("class.extend"), operationId: uuid, child: uuid, parent: uuid }),
  z.strictObject({ kind: z.literal("class.assign"), operationId: uuid, entity: uuid, class: uuid }),
  z.strictObject({ kind: z.literal("task.set"), operationId: uuid, task: uuid, status: z.string().min(1), priority: z.string().min(1).optional(), scheduled: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), repeat: z.enum(["daily"]).optional() }),
  z.strictObject({ kind: z.literal("task.cycle"), operationId: uuid, task: uuid, statuses: z.array(z.string().min(1)).min(2).refine(statuses => new Set(statuses).size === statuses.length, "Task statuses must be unique") }),
  z.strictObject({ kind: z.literal("task.complete"), operationId: uuid, task: uuid, scheduled: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), repeat: z.enum(["daily"]) }),
  z.strictObject({ kind: z.literal("journal.get"), operationId: uuid, journal: uuid, date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), display: z.string() })
]);

/** Worker-owned semantic operations for properties, tasks and journal identities. */
export function createPropertyTaskJournalWorker(path: string) {
  const db = createGraphDatabase({ path, uuid: { next: randomUUID }, clock: { now: Date.now } });
  let serial = Promise.resolve();
  const execute = async (raw: unknown) => {
      const command = commandSchema.parse(raw);
      const assertions: unknown[] = [];
      if (command.kind === "property.define") assertions.push({ kind: "entity.create", uuid: command.uuid }, { kind: "fact.set", entity: command.uuid, attribute: ":property/name", value: command.name }, { kind: "fact.set", entity: command.uuid, attribute: ":property/type", value: command.type }, { kind: "fact.set", entity: command.uuid, attribute: ":property/cardinality", value: command.cardinality });
      if (command.kind === "property.set") {
        const property = await db.pull([":property/type", ":property/cardinality"], command.property);
        if (property.status === "absent") throw new Error("PROPERTY_NOT_FOUND");
        const type = property.entity.attributes[":property/type"]?.[0];
        const cardinality = property.entity.attributes[":property/cardinality"]?.[0];
        if (typeof type !== "string" || typeof cardinality !== "string") throw new Error("PROPERTY_SCHEMA_INVALID");
        if (command.values.some(item => item.type !== type)) throw new Error("PROPERTY_VALUE_TYPE_MISMATCH");
        if (cardinality === "one" && command.values.length !== 1) throw new Error("PROPERTY_CARDINALITY_VIOLATION");
        const attribute = `:property/value/${command.property}`;
        for (const [index, item] of command.values.entries()) assertions.push({ kind: cardinality === "one" && index === 0 ? "fact.replace" : "fact.set", entity: command.entity, attribute, value: item.type === "node" ? { type: "entity", uuid: item.value } : item.value });
      }
      if (command.kind === "class.define") { assertions.push({ kind: "entity.create", uuid: command.uuid }, { kind: "fact.set", entity: command.uuid, attribute: ":class/name", value: command.name }); for (const property of command.properties) assertions.push({ kind: "fact.set", entity: command.uuid, attribute: ":class/property", value: { type: "entity", uuid: property } }); for (const parent of command.parents) { if (parent === command.uuid || await reaches(db, parent, command.uuid)) throw new Error("CLASS_CYCLE"); assertions.push({ kind: "fact.set", entity: command.uuid, attribute: ":class/parent", value: { type: "entity", uuid: parent } }); } }
      if (command.kind === "class.extend") { if (command.child === command.parent || await reaches(db, command.parent, command.child)) throw new Error("CLASS_CYCLE"); assertions.push({ kind: "fact.set", entity: command.child, attribute: ":class/parent", value: { type: "entity", uuid: command.parent } }); }
      if (command.kind === "class.assign") assertions.push({ kind: "fact.set", entity: command.entity, attribute: ":entity/class", value: { type: "entity", uuid: command.class } });
      if (command.kind === "task.set") { assertions.push({ kind: "fact.replace", entity: command.task, attribute: ":task/status", value: command.status }); if (command.priority) assertions.push({ kind: "fact.replace", entity: command.task, attribute: ":task/priority", value: command.priority }); if (command.scheduled) assertions.push({ kind: "fact.replace", entity: command.task, attribute: ":task/scheduled", value: command.scheduled }); if (command.deadline) assertions.push({ kind: "fact.replace", entity: command.task, attribute: ":task/deadline", value: command.deadline }); if (command.repeat) assertions.push({ kind: "fact.replace", entity: command.task, attribute: ":task/repeat", value: command.repeat }); }
      if (command.kind === "task.cycle") { const task = await db.pull([":task/status"], command.task); const status = task.status === "found" ? task.entity.attributes[":task/status"]?.[0] : undefined; if (typeof status !== "string") throw new Error("TASK_STATUS_NOT_FOUND"); const index = command.statuses.indexOf(status); if (index === -1) throw new Error("TASK_STATUS_NOT_CONFIGURED"); assertions.push({ kind: "fact.replace", entity: command.task, attribute: ":task/status", value: command.statuses[(index + 1) % command.statuses.length]! }); }
      if (command.kind === "task.complete") assertions.push({ kind: "fact.replace", entity: command.task, attribute: ":task/status", value: "Todo" }, { kind: "fact.replace", entity: command.task, attribute: ":task/scheduled", value: nextDay(command.scheduled) });
      let journal = command.kind === "journal.get" ? await journalForDate(db, command.date) : undefined;
      if (command.kind === "journal.get" && journal === undefined) assertions.push(...journalAssertions(command));
      if (command.kind === "journal.get" && journal === command.journal) {
        const existing = await db.pull([":journal/creation-operation"], journal);
        if (existing.status === "found" && existing.entity.attributes[":journal/creation-operation"]?.includes(command.operationId)) assertions.push(...journalAssertions(command));
      }
      if (assertions.length === 0) return journal === undefined ? { operationId: command.operationId, revision: db.revision, datoms: [] } : { operationId: command.operationId, revision: db.revision, datoms: [], journal };
      const report = await db.transact({ operationId: command.operationId, source: "system", assertions });
      return command.kind === "journal.get" ? { ...report, journal: command.journal } : report;
  };
  return {
    execute(raw: unknown) {
      const pending = serial.then(() => execute(raw));
      serial = pending.then(() => undefined, () => undefined);
      return pending;
    },
    pull: (entity: string) => db.pull(["*"], entity),
    async effectiveProperties(entity: string) { const found = await db.pull([":entity/class"], entity); if (found.status === "absent") return Object.freeze([]); const result = new Set<string>(); const visited = new Set<string>(); const visit = async (id: string): Promise<void> => { if (visited.has(id)) return; visited.add(id); const item = await db.pull([":class/property", ":class/parent"], id); if (item.status === "found") { for (const value of item.entity.attributes[":class/property"] ?? []) if (typeof value === "object" && value && "uuid" in value) result.add(String((value as { uuid: string }).uuid)); for (const value of item.entity.attributes[":class/parent"] ?? []) if (typeof value === "object" && value && "uuid" in value) await visit(String((value as { uuid: string }).uuid)); } }; for (const value of found.entity.attributes[":entity/class"] ?? []) if (typeof value === "object" && value && "uuid" in value) await visit(String((value as { uuid: string }).uuid)); const named = await Promise.all([...result].map(async uuid => { const property = await db.pull([":property/name"], uuid); const name = property.status === "found" ? property.entity.attributes[":property/name"]?.[0] : undefined; return { uuid, name: typeof name === "string" ? name : uuid }; })); return Object.freeze(named.sort((left, right) => left.name.localeCompare(right.name) || left.uuid.localeCompare(right.uuid)).map(property => property.uuid)); },
    close: () => db.close()
  };
}

function nextDay(date: string): string { const value = new Date(`${date}T00:00:00.000Z`); if (Number.isNaN(value.valueOf())) throw new Error("Invalid ISO date"); value.setUTCDate(value.getUTCDate() + 1); return value.toISOString().slice(0, 10); }
async function reaches(db: ReturnType<typeof createGraphDatabase>, from: string, target: string, seen = new Set<string>()): Promise<boolean> { if (from === target) return true; if (seen.has(from)) return false; seen.add(from); const entity = await db.pull([":class/parent"], from); if (entity.status === "absent") return false; for (const value of entity.entity.attributes[":class/parent"] ?? []) if (typeof value === "object" && value !== null && "uuid" in value && await reaches(db, String((value as { uuid: string }).uuid), target, seen)) return true; return false; }
async function journalForDate(db: ReturnType<typeof createGraphDatabase>, date: string): Promise<string | undefined> { const journals = await db.scan([":journal/date"]); return journals.find(entity => entity.attributes[":journal/date"]?.includes(date))?.uuid; }
function journalAssertions(command: Extract<z.infer<typeof commandSchema>, { readonly kind: "journal.get" }>) { return [{ kind: "entity.create" as const, uuid: command.journal }, { kind: "fact.set" as const, entity: command.journal, attribute: ":journal/date", value: command.date }, { kind: "fact.set" as const, entity: command.journal, attribute: ":journal/display", value: command.display }, { kind: "fact.set" as const, entity: command.journal, attribute: ":journal/creation-operation", value: command.operationId }]; }
