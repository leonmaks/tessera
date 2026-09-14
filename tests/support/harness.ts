import { readFileSync } from "node:fs";
import type { CanonicalSnapshot, CompatibilityScenario, ReferenceProvider } from "../../packages/compatibility-oracle/src/index.js";

export const baseline: unknown = JSON.parse(readFileSync(new URL("../../upstream/baseline.json", import.meta.url), "utf8"));
export const sha = "be800f171172c259d4dd942346e4d247a0783738";
export const scenario: CompatibilityScenario = { id: "harness-contract", description: "Harness test double, not Logseq execution", commands: [{ op: "createPage", name: "Page" }] };
export function fixture(): CanonicalSnapshot {
  return JSON.parse(readFileSync(new URL("../fixtures/parity/harness/canonical.json", import.meta.url), "utf8")) as CanonicalSnapshot;
}
export function provider(snapshot: unknown = fixture()): ReferenceProvider {
  return { name: "fixture-test-double", baselineCommit: sha, evidence: "test-double", async execute() { return structuredClone(snapshot) as CanonicalSnapshot; } };
}
