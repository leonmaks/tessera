import { describe, expect, it, vi } from "vitest";
import { openBrowserOpfsDatabase } from "../../packages/graph-db/src/browser-opfs.js";

describe("browser SQLite OPFS authority", () => {
  it("requires a worker and never exposes the raw SQLite handle", async () => {
    await expect(openBrowserOpfsDatabase({ graphName: "graph", workerContext: () => false, initialize: vi.fn() as never })).rejects.toThrow("BROWSER_SQLITE_WORKER_REQUIRED");
    const calls: string[] = [];
    class FakeDatabase {
      exec(input: string | { sql: string; resultRows?: Record<string, unknown>[] }): void { const sql = typeof input === "string" ? input : input.sql; calls.push(sql); if (typeof input !== "string" && input.resultRows) input.resultRows.push({ value: 1 }); }
      close(): void { calls.push("CLOSE"); }
    }
    const initialize = vi.fn(async () => ({ installOpfsSAHPoolVfs: vi.fn(async () => ({ OpfsSAHPoolDb: FakeDatabase })) }));
    const database = await openBrowserOpfsDatabase({ graphName: "graph", workerContext: () => true, initialize: initialize as never });
    expect(database).toMatchObject({ backend: "sqlite-wasm-opfs-sahpool", filename: "/graph.sqlite3" });
    expect(database).not.toHaveProperty("database"); expect(database).not.toHaveProperty("handle");
    expect(database.select("SELECT 1")).toEqual([{ value: 1 }]);
    expect(database.transaction(authority => { authority.execute("INSERT"); return "ok"; })).toBe("ok");
    database.close();
    expect(calls).toEqual(["PRAGMA foreign_keys = ON", "SELECT 1", "BEGIN IMMEDIATE", "INSERT", "COMMIT", "CLOSE"]);
  });
});
