import { z } from "zod";

export { inspectPinnedUpstream, runPinnedUpstream } from "./upstream-runner.js";
export type { PinnedUpstream, UpstreamCommandResult } from "./upstream-runner.js";

export interface CanonicalNode {
  readonly uuid: string;
  readonly kind: string;
  readonly content: string;
  readonly parentUuid?: string;
  readonly pageUuid?: string;
  readonly orderKey?: string;
  readonly tags: readonly string[];
  readonly refs: readonly string[];
  readonly properties: Readonly<Record<string, unknown>>;
}

export interface CanonicalSnapshot {
  readonly graphLabel: string;
  readonly nodes: readonly CanonicalNode[];
}

export type ScenarioCommand =
  | { readonly op: "createPage"; readonly name: string; readonly as?: string }
  | { readonly op: "insertBlock"; readonly target: string; readonly position: string; readonly content: string; readonly as?: string }
  | { readonly op: "updateBlock"; readonly target: string; readonly content: string }
  | { readonly op: "moveBlock"; readonly target: string; readonly destination: string; readonly position: string }
  | { readonly op: "moveBlocks"; readonly targets: readonly string[]; readonly destination: string; readonly position: string }
  | { readonly op: "indentBlocks"; readonly targets: readonly string[] }
  | { readonly op: "outdentBlocks"; readonly targets: readonly string[] }
  | { readonly op: "splitBlock"; readonly target: string; readonly offset: number; readonly as?: string }
  | { readonly op: "mergeWithPrevious"; readonly target: string }
  | { readonly op: "deleteBlock"; readonly target: string }
  | { readonly op: "setProperty"; readonly target: string; readonly property: string; readonly value: unknown }
  | { readonly op: "pluginCommand"; readonly id: string; readonly args: readonly unknown[] };

export interface CompatibilityScenario {
  readonly id: string;
  readonly description: string;
  readonly commands: readonly ScenarioCommand[];
}

export interface ParityProvider {
  readonly name: string;
  execute(scenario: CompatibilityScenario): Promise<CanonicalSnapshot>;
}

export interface ReferenceProvider extends ParityProvider {
  readonly baselineCommit: string;
  readonly evidence: "upstream-execution" | "test-double";
}

export interface ParityReport {
  readonly baselineCommit: string;
  readonly candidate: string;
  readonly reference: string;
  readonly evidence: ReferenceProvider["evidence"];
  readonly equal: boolean;
  readonly compatible: boolean;
  readonly candidateSnapshot: CanonicalSnapshot;
  readonly referenceSnapshot: CanonicalSnapshot;
}

const text = z.string().min(1);
const alias = { as: text.optional() };
export const scenarioSchema = z.strictObject({
  id: text,
  description: z.string(),
  commands: z.array(z.discriminatedUnion("op", [
    z.strictObject({ op: z.literal("createPage"), name: text, ...alias }),
    z.strictObject({ op: z.literal("insertBlock"), target: text, position: text, content: z.string(), ...alias }),
    z.strictObject({ op: z.literal("updateBlock"), target: text, content: z.string() }),
    z.strictObject({ op: z.literal("moveBlock"), target: text, destination: text, position: text }),
    z.strictObject({ op: z.literal("moveBlocks"), targets: z.array(text).min(1), destination: text, position: text }),
    z.strictObject({ op: z.literal("indentBlocks"), targets: z.array(text).min(1) }),
    z.strictObject({ op: z.literal("outdentBlocks"), targets: z.array(text).min(1) }),
    z.strictObject({ op: z.literal("splitBlock"), target: text, offset: z.number().int().nonnegative(), ...alias }),
    z.strictObject({ op: z.literal("mergeWithPrevious"), target: text }),
    z.strictObject({ op: z.literal("deleteBlock"), target: text }),
    z.strictObject({ op: z.literal("setProperty"), target: text, property: text, value: z.json() }),
    z.strictObject({ op: z.literal("pluginCommand"), id: text, args: z.array(z.json()) })
  ]))
});

export const canonicalSnapshotSchema = z.strictObject({
  graphLabel: text,
  nodes: z.array(z.strictObject({
    uuid: z.uuid(), kind: text, content: z.string(),
    parentUuid: z.uuid().optional(), pageUuid: z.uuid().optional(), orderKey: text.optional(),
    tags: z.array(text), refs: z.array(text), properties: z.record(z.string(), z.json())
  })).refine(nodes => new Set(nodes.map(node => node.uuid)).size === nodes.length, "Duplicate node UUID")
});

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

function orderedJson(value: JsonValue): JsonValue {
  if (Array.isArray(value)) return value.map(orderedJson);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, orderedJson(value[key]!)]));
  }
  return value;
}

export function canonicalizeSnapshot(input: unknown): CanonicalSnapshot {
  const snapshot = canonicalSnapshotSchema.parse(input);
  return {
    graphLabel: snapshot.graphLabel,
    nodes: snapshot.nodes.map(node => ({
      uuid: node.uuid, kind: node.kind, content: node.content,
      ...(node.parentUuid === undefined ? {} : { parentUuid: node.parentUuid }),
      ...(node.pageUuid === undefined ? {} : { pageUuid: node.pageUuid }),
      ...(node.orderKey === undefined ? {} : { orderKey: node.orderKey }),
      tags: [...node.tags].sort(), refs: [...node.refs].sort(),
      properties: Object.fromEntries(Object.keys(node.properties).sort().map(key => [key, orderedJson(node.properties[key]!)]))
    })).sort((a, b) => a.uuid < b.uuid ? -1 : a.uuid > b.uuid ? 1 : 0)
  };
}

export async function runParity(baseline: unknown, input: unknown, candidate: ParityProvider, reference: ReferenceProvider): Promise<ParityReport> {
  const pin = z.object({ status: z.literal("PINNED"), commit: z.string().regex(/^[0-9a-f]{40}$/) }).safeParse(baseline);
  if (!pin.success) throw new Error("UNPINNED: exact baseline SHA required");
  if (reference.baselineCommit !== pin.data.commit) throw new Error("BASELINE_MISMATCH");
  const evidence = z.enum(["upstream-execution", "test-double"]).parse(reference.evidence);
  text.parse(candidate.name);
  text.parse(reference.name);
  const scenario = scenarioSchema.parse(input) as CompatibilityScenario;
  const candidateSnapshot = canonicalizeSnapshot(await candidate.execute(structuredClone(scenario)));
  const referenceSnapshot = canonicalizeSnapshot(await reference.execute(structuredClone(scenario)));
  const equal = JSON.stringify(candidateSnapshot) === JSON.stringify(referenceSnapshot);
  return { baselineCommit: pin.data.commit, candidate: candidate.name, reference: reference.name, evidence,
    equal, compatible: equal && evidence === "upstream-execution", candidateSnapshot, referenceSnapshot };
}
