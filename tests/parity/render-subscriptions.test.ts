import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { createRendererStore } from "../../packages/graph-client/src/index.js";
import { runParity } from "../../packages/compatibility-oracle/src/index.js";
import type { CompatibilityScenario, ParityProvider, ReferenceProvider } from "../../packages/compatibility-oracle/src/index.js";
import type { GraphId, UUID } from "../../packages/domain/src/index.js";
import { baseline, sha } from "../support/harness.js";

const scenario = JSON.parse(readFileSync(new URL("../fixtures/parity/render/stale-child-patch.scenario.json", import.meta.url), "utf8")) as CompatibilityScenario;
const id = "00000000-0000-4000-8000-000000000604" as UUID;
const graphId = id as GraphId;
const snapshot = { graphLabel: scenario.id, nodes: [{ uuid: id, kind: "render-resource", content: "children", tags: [], refs: [], properties: { stale: true, members: ["a"] } }] };
const candidate: ParityProvider = { name: "phase06-render-candidate", async execute() { const store = createRendererStore(); store.seedChildren(id, [{ uuid: id, order: "a" as never }], 10); store.apply({ graphId, rev: 11 as never, blocks: [], deleted: [], children: [{ parent: id, baseRev: 9 as never, rev: 11 as never, remove: [], upsert: [] }], affectedResources: [] }); return snapshot; } };
const reference: ReferenceProvider = { name: "phase06-fixture-test-double", baselineCommit: sha, evidence: "test-double", async execute() { return snapshot; } };
it("keeps Phase 06 renderer provenance explicit", async () => { await expect(runParity(baseline, scenario, candidate, reference)).resolves.toMatchObject({ equal: true, compatible: false }); });
