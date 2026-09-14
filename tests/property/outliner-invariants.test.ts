import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { createGraphDatabase } from "../../packages/graph-db/src/index.js";
import { createOutliner } from "../../packages/outliner/src/index.js";
import type { UUID } from "../../packages/domain/src/index.js";

describe("outliner invariant suite bootstrap", () => {
  it("documents the invariant set that Phase 02 must activate", () => {
    const required = [
      "unique UUIDs",
      "no parent cycles",
      "sibling order is total",
      "page membership follows ancestry",
      "move preserves subtree identity",
      "every live non-root block is reachable"
    ];

    expect(required).toHaveLength(6);
  });

  it("keeps randomized structural command sequences acyclic and page-consistent", async () => {
    await fc.assert(fc.asyncProperty(fc.array(fc.constantFrom("insert", "indent", "outdent", "move"), { minLength: 1, maxLength: 24 }), async commands => {
      let sequence = 500;
      const uuid = { next: () => `00000000-0000-4000-8000-${(++sequence).toString().padStart(12, "0")}` };
      const graph = createGraphDatabase({ path: ":memory:", clock: { now: () => 1 }, uuid });
      const outliner = createOutliner({ graph, uuid });
      const first = await outliner.createPage("first");
      const second = await outliner.createPage("second");
      const blocks: UUID[] = [];
      for (const command of commands) {
        if (command === "insert" || blocks.length === 0) blocks.push((await outliner.insertBlock({ content: String(blocks.length), position: { kind: "last-child", parent: first.uuid } })).uuid);
        else if (command === "indent" && blocks.length > 1) await outliner.indent([blocks.at(-1)!]);
        else if (command === "outdent") await outliner.outdent([blocks.at(-1)!]);
        else await outliner.moveBlock(blocks[0]!, { kind: "last-child", parent: second.uuid });
      }
      const snapshot = await outliner.snapshot();
      for (const node of snapshot.blocks()) {
        const lineage = new Set<string>();
        let current = node;
        while (current.kind === "block") {
          expect(lineage.has(current.uuid)).toBe(false);
          lineage.add(current.uuid);
          expect(current.page).toBeDefined();
          const parent = snapshot.node(current.parent);
          expect(parent).toBeDefined();
          if (!parent || parent.kind === "page") break;
          current = parent;
        }
      }
      await graph.close();
    }), { numRuns: 30 });
  });
});
