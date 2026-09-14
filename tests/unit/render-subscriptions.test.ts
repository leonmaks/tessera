import { describe, expect, it, vi } from "vitest";
import { createRendererStore } from "../../packages/graph-client/src/index.js";
import { createGraphWorker } from "../../packages/graph-worker/src/index.js";
import type { GraphId, GraphNode, OperationId, UUID } from "../../packages/domain/src/index.js";
import type { RenderDelta } from "../../packages/graph-worker/src/index.js";

const id = "00000000-0000-4000-8000-000000000601" as UUID;
const graphId = id as GraphId;
const operationId = id as OperationId;
const block: GraphNode = Object.freeze({ id: 1 as GraphNode["id"], uuid: id, title: "A", tags: [], refs: [], createdAt: 1, updatedAt: 1, txId: 1 as GraphNode["txId"] });
function delta(rev: number, children: RenderDelta["children"] = []): RenderDelta { return { graphId, rev: rev as RenderDelta["rev"], operationId, blocks: [{ uuid: id, txId: 1, value: block }], deleted: [], children, affectedResources: [`block:${id}`] }; }

describe("revision-aware renderer subscriptions", () => {
  it("ignores an old delta and exposes only frozen snapshots", () => {
    const store = createRendererStore();
    store.apply(delta(12));
    const before = store.snapshot();
    store.apply(delta(11));
    expect(store.snapshot()).toBe(before);
    expect(Object.isFrozen(before)).toBe(true);
    expect(Object.isFrozen(before.blocks)).toBe(true);
  });

  it("marks children stale instead of merging an incompatible patch", () => {
    const reload = vi.fn();
    const store = createRendererStore({ reloadChildren: reload });
    store.seedChildren(id, [{ uuid: id, order: "a" as never }], 10);
    store.apply(delta(11, [{ parent: id, baseRev: 9 as never, rev: 11 as never, remove: [], upsert: [] }]));
    expect(store.snapshot().children[id]?.stale).toBe(true);
    expect(store.snapshot().children[id]?.members).toEqual([{ uuid: id, order: "a" }]);
    expect(reload).toHaveBeenCalledWith(id);
  });

  it("publishes a committed command once and omits a duplicate result delta", async () => {
    const worker = createGraphWorker({
      execute: async () => ({ operationId, transactionId: 1, revision: 1 as never, result: { ok: true }, delta: delta(1) }),
      query: async () => ({})
    });
    const listener = vi.fn();
    worker.subscribe(listener);
    const result = await worker.execute({ commandId: operationId, graphId, actor: { kind: "user" }, command: { kind: "block.delete", uuid: id } });
    expect(listener).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ operationId, revision: 1, result: { ok: true } });
    expect(result).not.toHaveProperty("delta");
  });
});
