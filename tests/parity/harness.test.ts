import { describe, expect, it } from "vitest";
import { canonicalizeSnapshot, runParity } from "../../packages/compatibility-oracle/src/index.js";
import { baseline, fixture, provider, scenario, sha } from "../support/harness.js";
import type {
  CanonicalSnapshot,
  CompatibilityScenario,
  ParityProvider
} from "../../packages/compatibility-oracle/src/index.js";

class DeterministicProvider implements ParityProvider {
  readonly name = "deterministic-test";

  async execute(scenario: CompatibilityScenario): Promise<CanonicalSnapshot> {
    return {
      graphLabel: scenario.id,
      nodes: []
    };
  }
}

describe("compatibility oracle contract", () => {
  it("requires scenario identity in the produced deterministic snapshot", async () => {
    const provider = new DeterministicProvider();
    const snapshot = await provider.execute({
      id: "empty-graph",
      description: "empty graph",
      commands: []
    });

    expect(snapshot.graphLabel).toBe("empty-graph");
    expect(snapshot.nodes).toEqual([]);
  });
});

describe("validated parity execution", () => {
  it("reports exact provenance without claiming test-double compatibility", async () => {
    const report = await runParity(baseline, scenario, provider(), provider());
    expect(report).toMatchObject({ baselineCommit: sha, equal: true, compatible: false, evidence: "test-double" });
  });

  it.each([{}, { status: "UNPINNED", commit: sha }, { status: "PINNED", commit: "short" }])("rejects invalid baseline before execution: %j", async (pin) => {
    const adapter = provider();
    adapter.execute = async () => { throw new Error("must not execute"); };
    await expect(runParity(pin, scenario, adapter, adapter)).rejects.toThrow("UNPINNED");
  });

  it("rejects reference provenance mismatch", async () => {
    await expect(runParity(baseline, scenario, provider(), { ...provider(), baselineCommit: "a".repeat(40) })).rejects.toThrow("BASELINE_MISMATCH");
  });

  it("rejects invalid commands and snapshots", async () => {
    await expect(runParity(baseline, { ...scenario, commands: [{ op: "rawWrite" }] }, provider(), provider())).rejects.toThrow();
    for (const snapshot of [{ nodes: [] }, { ...fixture(), extra: 1 }, { ...fixture(), nodes: [fixture().nodes[0], fixture().nodes[0]] }]) {
      await expect(runParity(baseline, scenario, provider(snapshot), provider())).rejects.toThrow();
    }
    expect(() => canonicalizeSnapshot({ ...fixture(), nodes: [{ ...fixture().nodes[0], uuid: "invalid" }] })).toThrow();
  });

  it("normalizes enumeration without changing inputs or property array order", () => {
    const original = fixture();
    const before = structuredClone(original);
    const shuffled = { ...original, nodes: [...original.nodes].reverse().map(node => ({ ...node, tags: [...node.tags].reverse(), refs: [...node.refs].reverse(), properties: Object.fromEntries(Object.entries(node.properties).reverse()) })) };
    expect(canonicalizeSnapshot(original)).toEqual(canonicalizeSnapshot(shuffled));
    expect(original).toEqual(before);
  });

  it("preserves property array ordering while sorting nested object keys", () => {
    const snapshot = fixture();
    const withProperty = (value: unknown) => ({ ...snapshot, nodes: snapshot.nodes.map(node => ({ ...node, properties: { value } })) });
    expect(canonicalizeSnapshot(withProperty({ a: 1, b: 2 }))).toEqual(canonicalizeSnapshot(withProperty({ b: 2, a: 1 })));
    expect(canonicalizeSnapshot(withProperty([1, 2]))).not.toEqual(canonicalizeSnapshot(withProperty([2, 1])));
  });

  it.each(["content", "uuid", "parentUuid", "pageUuid", "orderKey", "tags", "refs", "properties"])("preserves semantic differences in %s", async (field) => {
    const snapshot = fixture();
    const values: Record<string, unknown> = { content: "changed", uuid: "00000000-0000-4000-8000-000000000003", parentUuid: "00000000-0000-4000-8000-000000000003", pageUuid: "00000000-0000-4000-8000-000000000003", orderKey: "a1", tags: [], refs: [], properties: { list: [1, 2] } };
    const changed = { ...snapshot, nodes: snapshot.nodes.map((node, i) => i === 0 ? { ...node, [field]: values[field] } : node) };
    const report = await runParity(baseline, scenario, provider(changed), provider());
    expect(report.equal).toBe(false);
    expect(report.candidateSnapshot).not.toEqual(report.referenceSnapshot);
  });

  it("isolates provider inputs and propagates provider failures", async () => {
    const candidate = provider();
    candidate.execute = async input => { (input.commands as unknown[]).pop(); return fixture(); };
    const reference = provider();
    reference.execute = async input => { expect(input).toEqual(scenario); return fixture(); };
    await runParity(baseline, scenario, candidate, reference);
    expect(scenario.commands).toHaveLength(1);
    candidate.execute = async () => { throw new Error("provider failed"); };
    await expect(runParity(baseline, scenario, candidate, reference)).rejects.toThrow("provider failed");
  });
});
