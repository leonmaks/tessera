import { expect, it } from "vitest";
import { createGraphDatabase } from "../../packages/graph-db/src/index.js";

it("uses the Node SQLite adapter behind the graph-db API", async () => {
  const db = createGraphDatabase({ path: ":memory:", clock: { now: () => 1 }, uuid: { next: () => "00000000-0000-4000-8000-000000000001" } });
  expect(db.schemaVersion).toBeGreaterThanOrEqual(1);
  await db.close();
});
