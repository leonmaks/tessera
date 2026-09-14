import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { runParity } from "../../packages/compatibility-oracle/src/index.js";
import type { CanonicalNode, CanonicalSnapshot, CompatibilityScenario, ParityProvider, ReferenceProvider, ScenarioCommand } from "../../packages/compatibility-oracle/src/index.js";
import { createGraphDatabase } from "../../packages/graph-db/src/index.js";
import { createOutliner } from "../../packages/outliner/src/index.js";
import { baseline, sha } from "../support/harness.js";

const fixtures = ["insert-after", "structural-commands"] as const;
const ids = ["00000000-0000-4000-8000-000000000101", "00000000-0000-4000-8000-000000000103", "00000000-0000-4000-8000-000000000105", "00000000-0000-4000-8000-000000000107", "00000000-0000-4000-8000-000000000109"];

function scenario(name: string): CompatibilityScenario { return JSON.parse(readFileSync(new URL(`../fixtures/parity/outliner/${name}.scenario.json`, import.meta.url), "utf8")) as CompatibilityScenario; }
function resolve(aliases: ReadonlyMap<string, string>, value: string): string { const resolved = aliases.get(value.slice(1)); if (!resolved) throw new Error(`Unknown fixture alias: ${value}`); return resolved; }
function position(command: Extract<ScenarioCommand, { readonly op: "insertBlock" | "moveBlock" | "moveBlocks" }>, aliases: ReadonlyMap<string, string>) {
  const target = command.op === "insertBlock" ? command.target : command.destination;
  const uuid = resolve(aliases, target);
  return command.position === "before" ? { kind: "before" as const, block: uuid as never } : command.position === "after" || command.position === "sibling" ? { kind: "after" as const, block: uuid as never } : { kind: command.position === "first-child" ? "first-child" as const : "last-child" as const, parent: uuid as never };
}

const candidate: ParityProvider = {
  name: "phase02-sqlite-outliner-candidate",
  async execute(input) {
    let counter = 100;
    const uuid = { next: () => `00000000-0000-4000-8000-${(++counter).toString().padStart(12, "0")}` };
    const graph = createGraphDatabase({ path: ":memory:", clock: { now: () => 1 }, uuid });
    const outliner = createOutliner({ graph, uuid });
    const aliases = new Map<string, string>();
    const pages = new Set<string>();
    for (const command of input.commands) {
      if (command.op === "createPage") { const page = await outliner.createPage(command.name); aliases.set(command.as ?? command.name, page.uuid); pages.add(page.uuid); }
      else if (command.op === "insertBlock") { const block = await outliner.insertBlock({ content: command.content, position: position(command, aliases) }); if (command.as) aliases.set(command.as, block.uuid); }
      else if (command.op === "moveBlock") await outliner.moveBlock(resolve(aliases, command.target) as never, position(command, aliases));
      else if (command.op === "moveBlocks") await outliner.moveBlocks(command.targets.map(target => resolve(aliases, target)) as never, position(command, aliases));
      else if (command.op === "indentBlocks") await outliner.indent(command.targets.map(target => resolve(aliases, target)) as never);
      else if (command.op === "outdentBlocks") await outliner.outdent(command.targets.map(target => resolve(aliases, target)) as never);
      else if (command.op === "splitBlock") { const split = await outliner.splitBlock({ uuid: resolve(aliases, command.target) as never, offset: command.offset }); if (command.as) aliases.set(command.as, split.right); }
      else if (command.op === "mergeWithPrevious") await outliner.mergeWithPrevious(resolve(aliases, command.target) as never);
      else if (command.op === "deleteBlock") await outliner.deleteBlock(resolve(aliases, command.target) as never);
      else throw new Error(`Unsupported outliner parity operation: ${command.op}`);
    }
    const snapshot = await outliner.snapshot();
    const nodes: CanonicalNode[] = [...pages].flatMap(uuid => { const node = snapshot.node(uuid as never); return node ? [{ uuid: node.uuid, kind: node.kind, content: node.content, tags: [], refs: [], properties: {} }] : []; });
    for (const block of snapshot.blocks()) nodes.push({ uuid: block.uuid, kind: block.kind, content: block.content, parentUuid: block.parent, pageUuid: block.page, orderKey: block.order, tags: [], refs: [], properties: {} });
    await graph.close();
    return { graphLabel: input.id, nodes };
  }
};

const expected: Record<string, CanonicalSnapshot> = {
  "outliner-insert-after": { graphLabel: "outliner-insert-after", nodes: [
    { uuid: ids[0]!, kind: "page", content: "P", tags: [], refs: [], properties: {} },
    { uuid: ids[1]!, kind: "block", content: "A", parentUuid: ids[0]!, pageUuid: ids[0]!, orderKey: "000000000000", tags: [], refs: [], properties: {} },
    { uuid: ids[2]!, kind: "block", content: "C", parentUuid: ids[0]!, pageUuid: ids[0]!, orderKey: "000000000002", tags: [], refs: [], properties: {} },
    { uuid: "00000000-0000-4000-8000-000000000107", kind: "block", content: "B", parentUuid: ids[0]!, pageUuid: ids[0]!, orderKey: "000000000001", tags: [], refs: [], properties: {} }
  ] },
  "outliner-structural-commands": { graphLabel: "outliner-structural-commands", nodes: [
    { uuid: "00000000-0000-4000-8000-000000000101", kind: "page", content: "P", tags: [], refs: [], properties: {} },
    { uuid: "00000000-0000-4000-8000-000000000103", kind: "page", content: "D", tags: [], refs: [], properties: {} },
    { uuid: "00000000-0000-4000-8000-000000000107", kind: "block", content: "B", parentUuid: "00000000-0000-4000-8000-000000000101", pageUuid: "00000000-0000-4000-8000-000000000101", orderKey: "000000000000", tags: [], refs: [], properties: {} },
    { uuid: "00000000-0000-4000-8000-000000000109", kind: "block", content: "C", parentUuid: "00000000-0000-4000-8000-000000000103", pageUuid: "00000000-0000-4000-8000-000000000103", orderKey: "000000000000", tags: [], refs: [], properties: {} }
  ] }
};

describe("Phase 02 structural parity fixtures", () => {
  for (const name of fixtures) it(`${name} remains an explicit non-upstream comparison`, async () => {
    const input = scenario(name);
    const reference: ReferenceProvider = { name: "phase02-fixture-test-double", baselineCommit: sha, evidence: "test-double", async execute() { return expected[input.id]!; } };
    await expect(runParity(baseline, input, candidate, reference)).resolves.toMatchObject({ equal: true, evidence: "test-double", compatible: false });
  });
});
