import sqlite3InitModule, { type BindingSpec, type Sqlite3Static, type SqlValue } from "@sqlite.org/sqlite-wasm";

export interface BrowserOpfsDatabase {
  readonly backend: "sqlite-wasm-opfs-sahpool";
  readonly filename: string;
  select(sql: string, bind?: BindingSpec): readonly Readonly<Record<string, SqlValue>>[];
  transaction<T>(work: (database: Pick<BrowserOpfsDatabase, "select"> & { execute(sql: string, bind?: BindingSpec): void }) => T): T;
  close(): void;
}
export interface BrowserOpfsOptions { readonly graphName: string; readonly initialize?: () => Promise<Sqlite3Static>; readonly workerContext?: () => boolean; }

/** Opens authoritative SQLite in worker-only OPFS while keeping its raw handle closure-private. */
export async function openBrowserOpfsDatabase(options: BrowserOpfsOptions): Promise<BrowserOpfsDatabase> {
  if (!/^[a-z0-9][a-z0-9._-]{0,127}$/i.test(options.graphName)) throw new Error("INVALID_BROWSER_GRAPH_NAME");
  const isWorker = options.workerContext ?? (() => typeof WorkerGlobalScope !== "undefined" && globalThis instanceof WorkerGlobalScope);
  if (!isWorker()) throw new Error("BROWSER_SQLITE_WORKER_REQUIRED");
  const sqlite = await (options.initialize ?? sqlite3InitModule)();
  const pool = await sqlite.installOpfsSAHPoolVfs({ name: "tessera-opfs", directory: "/tessera", initialCapacity: 6 });
  const filename = `/${options.graphName}.sqlite3`;
  const database = new pool.OpfsSAHPoolDb(filename);
  database.exec("PRAGMA foreign_keys = ON");
  let closed = false;
  const assertOpen = () => { if (closed) throw new Error("Browser graph database is closed"); };
  const select = (sql: string, bind?: BindingSpec) => { assertOpen(); const resultRows: Record<string, SqlValue>[] = []; database.exec({ sql, ...(bind === undefined ? {} : { bind }), rowMode: "object", resultRows, returnValue: "resultRows" }); return freeze(resultRows); };
  const execute = (sql: string, bind?: BindingSpec) => { assertOpen(); database.exec({ sql, ...(bind === undefined ? {} : { bind }) }); };
  return Object.freeze({
    backend: "sqlite-wasm-opfs-sahpool" as const,
    filename,
    select,
    transaction<T>(work: (authority: Pick<BrowserOpfsDatabase, "select"> & { execute(sql: string, bind?: BindingSpec): void }) => T): T { assertOpen(); database.exec("BEGIN IMMEDIATE"); try { const result = work({ select, execute }); database.exec("COMMIT"); return result; } catch (error) { try { database.exec("ROLLBACK"); } catch { /* preserve original failure */ } throw error; } },
    close() { if (!closed) { database.close(); closed = true; } }
  });
}
function freeze<T>(value: T): T { if (value && typeof value === "object" && !Object.isFrozen(value)) { for (const child of Object.values(value as Record<string, unknown>)) freeze(child); Object.freeze(value); } return value; }
