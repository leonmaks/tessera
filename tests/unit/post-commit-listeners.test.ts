import { expect, it, vi } from "vitest";
import { createGraphDatabase } from "../../packages/graph-db/src/index.js";

it("isolates failing post-commit listeners", async () => {
  const entity = "00000000-0000-4000-8000-000000000041";
  const db = createGraphDatabase({ path: ":memory:", clock: { now: () => 1 }, uuid: { next: () => entity } });
  const healthy = vi.fn();
  db.subscribePostCommit(() => { throw new Error("index down"); });
  db.subscribePostCommit(healthy);
  const report = await db.transact({ operationId: "00000000-0000-4000-8000-000000000040", source: "editor", assertions: [{ kind: "entity.create", uuid: entity }] });
  expect(healthy).toHaveBeenCalledWith(report);
  expect(db.listenerFailures).toEqual([expect.objectContaining({ operationId: report.operationId, message: "index down" })]);
  expect(db.revision).toBe(1);
  await db.close();
});
