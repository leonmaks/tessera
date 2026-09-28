import { openBrowserOpfsDatabase } from "@tessera-ts/graph-db/browser-opfs";
import { executePageCreate } from "@tessera-ts/graph-worker/portable-page-runtime";
import type { BrowserOpfsDatabase } from "@tessera-ts/graph-db/browser-opfs";

const graphs = new Map<string, BrowserOpfsDatabase>();

async function databaseFor(graphName: string): Promise<BrowserOpfsDatabase> {
  let database = graphs.get(graphName);
  if (!database) { database = await openBrowserOpfsDatabase({ graphName }); graphs.set(graphName, database); }
  return database;
}

self.addEventListener("message", event => {
  void (async () => {
    const request = event.data as { readonly id?: unknown; readonly graphName?: unknown; readonly command?: unknown; readonly close?: unknown };
    if (typeof request.id !== "string" || typeof request.graphName !== "string") throw new Error("Invalid browser SQLite request");
    const database = await databaseFor(request.graphName);
    if (request.close === true) { database.close(); graphs.delete(request.graphName); self.postMessage({ id: request.id, ok: true }); return; }
      if (request.command !== undefined) {
        if (!request.command || typeof request.command !== "object" || (request.command as { kind?: unknown }).kind !== "page.create" || typeof (request.command as { title?: unknown }).title !== "string") throw new Error("Unsupported browser semantic command");
        database.transaction(sql => {
          sql.execute("CREATE TABLE IF NOT EXISTS tessera_browser_pages_v1 (uuid TEXT PRIMARY KEY, title TEXT NOT NULL COLLATE NOCASE UNIQUE)");
          sql.execute("CREATE TABLE IF NOT EXISTS tessera_browser_meta_v1 (key TEXT PRIMARY KEY, value INTEGER NOT NULL)");
          sql.execute("INSERT OR IGNORE INTO tessera_browser_meta_v1 (key, value) VALUES ('revision', 0)");
        });
        const result = await executePageCreate((request.command as { title: string }).title, {
          pages: async () => database.select("SELECT uuid, title FROM tessera_browser_pages_v1 ORDER BY uuid ASC").map(row => ({ uuid: String(row.uuid), content: String(row.title) })),
          createPage: async title => {
            const page = { uuid: crypto.randomUUID(), content: title };
            database.transaction(sql => { sql.execute("INSERT INTO tessera_browser_pages_v1 (uuid, title) VALUES (?, ?)", [page.uuid, page.content]); sql.execute("UPDATE tessera_browser_meta_v1 SET value = value + 1 WHERE key = 'revision'"); });
            return page;
          }
        });
        const revision = Number(database.select("SELECT value FROM tessera_browser_meta_v1 WHERE key = 'revision'")[0]?.value);
        self.postMessage({ id: request.id, ok: true, ...result, revision, rawHandleExposed: "handle" in database || "database" in database });
        return;
      }
      self.postMessage({ id: request.id, ok: true, backend: database.backend, filename: database.filename, rawHandleExposed: "handle" in database || "database" in database });
  })().catch(error => self.postMessage({ id: event.data?.id, ok: false, error: error instanceof Error ? error.message : String(error) }));
});
