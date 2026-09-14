import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { runParity } from "../../packages/compatibility-oracle/src/index.js";
import type { CanonicalSnapshot, CompatibilityScenario, ParityProvider, ReferenceProvider } from "../../packages/compatibility-oracle/src/index.js";
import { createGraphDatabase } from "../../packages/graph-db/src/index.js";
import { baseline, sha } from "../support/harness.js";

const scenario = JSON.parse(readFileSync(new URL("../fixtures/parity/transaction-engine/create-entity.scenario.json", import.meta.url), "utf8")) as CompatibilityScenario;
const page = "00000000-0000-4000-8000-000000000081";
const expected: CanonicalSnapshot = { graphLabel: scenario.id, nodes: [{ uuid: page, kind: "page", content: "Database page", tags: [], refs: [], properties: {} }] };

const candidate: ParityProvider = {
  name: "phase01-sqlite-candidate",
  async execute(input) {
    const name = input.commands[0];
    if (!name || name.op !== "createPage") throw new Error("Fixture requires a page creation command");
    const db = createGraphDatabase({ path: ":memory:", clock: { now: () => 1 }, uuid: { next: () => page } });
    await db.transact({ operationId: "00000000-0000-4000-8000-000000000080", source: "system", assertions: [{ kind: "entity.create", uuid: page }, { kind: "fact.set", entity: page, attribute: ":node/kind", value: "page" }, { kind: "fact.set", entity: page, attribute: ":node/content", value: name.name }] });
    const pulled = await db.pull(["*"], page);
    await db.close();
    if (pulled.status !== "found") throw new Error("Created page missing");
    return { graphLabel: input.id, nodes: [{ uuid: page, kind: String(pulled.entity.attributes[":node/kind"]?.[0]), content: String(pulled.entity.attributes[":node/content"]?.[0]), tags: [], refs: [], properties: {} }] };
  }
};

const reference: ReferenceProvider = { name: "phase01-fixture-test-double", baselineCommit: sha, evidence: "test-double", async execute() { return expected; } };

it("keeps the Phase 01 fixture explicit about unavailable upstream execution", async () => {
  const report = await runParity(baseline, scenario, candidate, reference);
  expect(report).toMatchObject({ baselineCommit: sha, equal: true, evidence: "test-double", compatible: false });
});
