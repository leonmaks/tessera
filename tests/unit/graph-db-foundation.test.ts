import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, it } from "vitest";
import { createGraphDatabase } from "../../packages/graph-db/src/index.js";

const entity = "00000000-0000-4000-8000-000000000071";
const operation = "00000000-0000-4000-8000-000000000070";

it("reopens generic typed semantic facts after an additive migration", async () => {
  const path = join(mkdtempSync(join(tmpdir(), "tessera-foundation-")), "graph.sqlite");
  const options = { path, clock: { now: () => 1 }, uuid: { next: () => entity } };
  const first = createGraphDatabase(options);
  first.applyMigrations([{ version: 2, name: "semantic-foundation", apply: () => undefined }]);
  await first.transact({
    operationId: operation,
    source: "system",
    assertions: [
      { kind: "entity.create", uuid: entity },
      { kind: "fact.set", entity, attribute: ":property/type", value: "number" },
      { kind: "fact.set", entity, attribute: ":task/scheduled", value: { type: "timestamp", value: 1 } },
      { kind: "fact.set", entity, attribute: ":reference/target", value: { type: "entity", uuid: entity } }
    ]
  });
  await first.close();

  const reopened = createGraphDatabase(options);
  expect(reopened.schemaVersion).toBe(2);
  await expect(reopened.pull(["*"], entity)).resolves.toMatchObject({
    status: "found",
    entity: { attributes: {
      ":property/type": ["number"],
      ":task/scheduled": [{ type: "timestamp", value: 1 }],
      ":reference/target": [{ type: "entity", uuid: entity }]
    } }
  });
  await reopened.close();
});
