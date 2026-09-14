import { expect, it } from "vitest";
import { createGraphDatabase } from "../../packages/graph-db/src/index.js";

it("pulls immutable UUID-addressed deterministic snapshots", async () => {
  const entity = "00000000-0000-4000-8000-000000000031";
  const db = createGraphDatabase({ path: ":memory:", clock: { now: () => 1 }, uuid: { next: () => entity } });
  await db.transact({ operationId: "00000000-0000-4000-8000-000000000030", source: "editor", assertions: [{ kind: "entity.create", uuid: entity }, { kind: "fact.set", entity, attribute: ":block/z", value: "z" }, { kind: "fact.set", entity, attribute: ":block/a", value: "a" }] });
  const first = await db.pull(["*"], entity);
  const second = await db.pull(["*"], entity);
  expect(first).toEqual({ status: "found", entity: { uuid: entity, attributes: { ":block/a": ["a"], ":block/z": ["z"] } } });
  expect(first).toEqual(second);
  expect(Object.isFrozen(first)).toBe(true);
  await expect(db.pull(["*"], "00000000-0000-4000-8000-000000000099")).resolves.toEqual({ status: "absent", uuid: "00000000-0000-4000-8000-000000000099" });
  await db.close();
});
