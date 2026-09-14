import fc from "fast-check";
import { expect, it } from "vitest";
import { createRendererStore } from "../../packages/graph-client/src/index.js";
import type { GraphId, UUID } from "../../packages/domain/src/index.js";
import type { RenderDelta } from "../../packages/graph-worker/src/index.js";

const id = "00000000-0000-4000-8000-000000000602" as UUID;
const graphId = id as GraphId;

it("never regresses the renderer revision for arbitrary delivery order", () => {
  fc.assert(fc.property(fc.array(fc.integer({ min: 0, max: 100 })), revisions => {
    const store = createRendererStore();
    for (const revision of revisions) store.apply({ graphId, rev: revision as RenderDelta["rev"], blocks: [], deleted: [], children: [], affectedResources: [] });
    expect(store.snapshot().revision).toBe(revisions.length === 0 ? 0 : Math.max(...revisions));
    expect(Object.isFrozen(store.snapshot())).toBe(true);
  }), { numRuns: 100 });
});
