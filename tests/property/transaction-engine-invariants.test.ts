import { afterEach, expect, it } from "vitest";
import fc from "fast-check";
import { createGraphDatabase } from "../../packages/graph-db/src/index.js";
import type { GraphDatabase } from "../../packages/graph-db/src/index.js";

const open: GraphDatabase[] = [];
afterEach(async () => { await Promise.all(open.splice(0).map(db => db.close())); });
it("preserves UUID uniqueness, monotonic revision and exact replay", async () => {
  await fc.assert(fc.asyncProperty(fc.uniqueArray(fc.integer({ min: 1, max: 999999 }), { maxLength: 20 }), async numbers => {
    const db = createGraphDatabase({ path: ":memory:", clock: { now: () => 1 }, uuid: { next: () => "00000000-0000-4000-8000-000000000001" } }); open.push(db);
    for (const [index, number] of numbers.entries()) {
      const entity = `00000000-0000-4000-8000-${String(number).padStart(12, "0")}`;
      const operation = `00000000-0000-4000-8000-${String(index + 500000).padStart(12, "0")}`;
      const input = { operationId: operation, source: "editor", assertions: [{ kind: "entity.create", uuid: entity }, { kind: "fact.set", entity, attribute: ":block/index", value: index }] };
      const report = await db.transact(input);
      expect(report.revision).toBe(index + 1);
      await expect(db.transact(input)).resolves.toEqual(report);
      expect(db.revision).toBe(index + 1);
      await expect(db.pull(["*"], entity)).resolves.toMatchObject({ status: "found" });
    }
  }), { numRuns: 50 });
});
