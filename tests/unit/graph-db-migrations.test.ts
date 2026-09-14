import { expect, it } from "vitest";
import { createGraphDatabase } from "../../packages/graph-db/src/index.js";

it("keeps last successful schema after a migration failure", () => {
  const db = createGraphDatabase({ path: ":memory:", clock: { now: () => 1 }, uuid: { next: () => "00000000-0000-4000-8000-000000000051" } });
  expect(() => db.applyMigrations([{ version: 2, name: "fails", apply: () => { throw new Error("stop"); } }])).toThrow("stop");
  expect(db.schemaVersion).toBe(1);
  return db.close();
});

it("applies ordered migrations only once", async () => {
  const db = createGraphDatabase({ path: ":memory:", clock: { now: () => 1 }, uuid: { next: () => "00000000-0000-4000-8000-000000000052" } });
  let applied = 0;
  db.applyMigrations([{ version: 2, name: "next", apply: () => { applied++; } }]);
  db.applyMigrations([{ version: 2, name: "next", apply: () => { applied++; } }]);
  expect({ applied, version: db.schemaVersion }).toEqual({ applied: 1, version: 2 });
  await db.close();
});
