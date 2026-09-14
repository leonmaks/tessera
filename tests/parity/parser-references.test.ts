import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { runParity } from "../../packages/compatibility-oracle/src/index.js";
import type { CanonicalSnapshot, CompatibilityScenario, ParityProvider, ReferenceProvider } from "../../packages/compatibility-oracle/src/index.js";
import { createParser } from "../../packages/parser/src/index.js";
import { extractReferences } from "../../packages/references/src/index.js";
import { baseline, sha } from "../support/harness.js";

const scenario = JSON.parse(readFileSync(new URL("../fixtures/parity/parser/page-and-code.scenario.json", import.meta.url), "utf8")) as CompatibilityScenario;
const expected: CanonicalSnapshot = { graphLabel: scenario.id, nodes: [{ uuid: "00000000-0000-4000-8000-000000000381", kind: "page-ref", content: "Architecture", tags: [], refs: [], properties: {} }] };
const candidate: ParityProvider = { name: "phase03-parser-candidate", async execute(input) { const command = input.commands[0]; if (!command || command.op !== "updateBlock") throw new Error("Parser fixture requires updateBlock"); const refs = extractReferences(createParser().parseMarkdown(command.content).blocks[0]!.inline); return { graphLabel: input.id, nodes: refs.pages.map((content, index) => ({ uuid: `00000000-0000-4000-8000-${(381 + index).toString().padStart(12, "0")}`, kind: "page-ref", content, tags: [], refs: [], properties: {} })) }; } };
const reference: ReferenceProvider = { name: "phase03-fixture-test-double", baselineCommit: sha, evidence: "test-double", async execute() { return expected; } };
it("keeps Phase 03 parser parity provenance explicit", async () => { await expect(runParity(baseline, scenario, candidate, reference)).resolves.toMatchObject({ equal: true, evidence: "test-double", compatible: false }); });
