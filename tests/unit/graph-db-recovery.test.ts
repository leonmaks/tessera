import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, it } from "vitest";
import { createGraphDatabase } from "../../packages/graph-db/src/index.js";

it("recovers only committed state after reopen", async () => {
  const path = join(mkdtempSync(join(tmpdir(), "tessera-db-")), "graph.sqlite");
  const entity = "00000000-0000-4000-8000-000000000061";
  const options = { path, clock: { now: () => 1 }, uuid: { next: () => entity } };
  const first = createGraphDatabase(options);
  await first.transact({ operationId: "00000000-0000-4000-8000-000000000060", source: "editor", assertions: [{ kind: "entity.create", uuid: entity }] });
  await first.close();
  const reopened = createGraphDatabase(options);
  expect(reopened.revision).toBe(1);
  await expect(reopened.pull(["*"], entity)).resolves.toMatchObject({ status: "found" });
  await reopened.close();
});
