import fc from "fast-check";
import { expect, it } from "vitest";
import { createQueryEngine } from "../../packages/query-engine/src/index.js";

it("returns a canonical, status-bounded task result for arbitrary fact order", async () => {
  await fc.assert(fc.asyncProperty(
    fc.array(fc.constantFrom("TODO", "DOING", "DONE"), { maxLength: 50 }),
    async statuses => {
      const facts = statuses.map((status, index) => ({
        entity: `block-${String(statuses.length - index).padStart(3, "0")}`,
        attribute: ":task/status",
        value: status
      }));
      const expected = facts.filter(fact => fact.value === "TODO" || fact.value === "DOING").map(fact => fact.entity).sort();
      await expect(createQueryEngine({ facts }).simple("(task TODO DOING)")).resolves.toEqual(expected);
    }
  ), { numRuns: 50 });
});
