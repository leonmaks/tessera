import { describe, expect, it } from "vitest";
import { createGraphDatabase } from "../../packages/graph-db/src/index.js";
import { createOutliner } from "../../packages/outliner/src/index.js";

function ids() {
  let value = 0;
  return { next: () => `00000000-0000-4000-8000-${(++value).toString().padStart(12, "0")}` };
}

function open() {
  const uuid = ids();
  const graph = createGraphDatabase({ path: ":memory:", clock: { now: () => 1 }, uuid });
  return { graph, outliner: createOutliner({ graph, uuid }) };
}

describe("outliner semantic commands", () => {
  it("inserts around an anchor and exposes immutable ordered membership", async () => {
    const { graph, outliner } = open();
    const page = await outliner.createPage("P");
    const a = await outliner.insertBlock({ content: "A", position: { kind: "last-child", parent: page.uuid } });
    await outliner.insertBlock({ content: "C", position: { kind: "last-child", parent: page.uuid } });
    await outliner.insertBlock({ content: "B", position: { kind: "after", block: a.uuid } });
    const snapshot = await outliner.snapshot();
    expect(snapshot.children(page.uuid).map(block => block.content)).toEqual(["A", "B", "C"]);
    expect(Object.isFrozen(snapshot)).toBe(true);
    await graph.close();
  });

  it("moves a subtree atomically across pages without changing UUIDs", async () => {
    const { graph, outliner } = open();
    const source = await outliner.createPage("source");
    const target = await outliner.createPage("target");
    const parent = await outliner.insertBlock({ content: "B", position: { kind: "last-child", parent: source.uuid } });
    const child = await outliner.insertBlock({ content: "C", position: { kind: "last-child", parent: parent.uuid } });
    const before = graph.revision;
    await outliner.moveBlock(parent.uuid, { kind: "last-child", parent: target.uuid });
    const snapshot = await outliner.snapshot();
    expect(snapshot.block(parent.uuid)).toMatchObject({ uuid: parent.uuid, page: target.uuid, parent: target.uuid });
    expect(snapshot.block(child.uuid)).toMatchObject({ uuid: child.uuid, page: target.uuid, parent: parent.uuid });
    expect(graph.revision).toBe(before + 1);
    await graph.close();
  });

  it("rejects cycles without committing a partial graph", async () => {
    const { graph, outliner } = open();
    const page = await outliner.createPage("P");
    const parent = await outliner.insertBlock({ content: "B", position: { kind: "last-child", parent: page.uuid } });
    const child = await outliner.insertBlock({ content: "C", position: { kind: "last-child", parent: parent.uuid } });
    const before = await outliner.snapshot();
    const revision = graph.revision;
    await expect(outliner.moveBlock(parent.uuid, { kind: "last-child", parent: child.uuid })).rejects.toMatchObject({ code: "OUTLINER_CYCLE" });
    expect(await outliner.snapshot()).toEqual(before);
    expect(graph.revision).toBe(revision);
    await graph.close();
  });

  it("supports indent/outdent, split/merge, deletion, grouped undo and ordered multi-move", async () => {
    const { graph, outliner } = open();
    const source = await outliner.createPage("P");
    const target = await outliner.createPage("D");
    const a = await outliner.insertBlock({ content: "A", position: { kind: "last-child", parent: source.uuid } });
    const b = await outliner.insertBlock({ content: "Hello world", position: { kind: "last-child", parent: source.uuid } });
    const c = await outliner.insertBlock({ content: "C", position: { kind: "last-child", parent: source.uuid } });
    await outliner.indent([b.uuid]);
    expect((await outliner.snapshot()).block(b.uuid).parent).toBe(a.uuid);
    await outliner.outdent([b.uuid]);
    const split = await outliner.splitBlock({ uuid: b.uuid, offset: 6 });
    expect((await outliner.snapshot()).children(source.uuid).map(block => block.content)).toEqual(["A", "Hello ", "world", "C"]);
    await outliner.mergeWithPrevious(split.right);
    await outliner.moveBlocks([a.uuid, c.uuid], { kind: "last-child", parent: target.uuid });
    expect((await outliner.snapshot()).children(target.uuid).map(block => block.content)).toEqual(["A", "C"]);
    await outliner.undo();
    expect((await outliner.snapshot()).children(source.uuid).map(block => block.content)).toEqual(["A", "Hello world", "C"]);
    await outliner.redo();
    const beforeDelete = graph.revision;
    await outliner.deleteBlock(a.uuid);
    expect((await outliner.snapshot()).children(target.uuid).map(block => block.content)).toEqual(["C"]);
    expect(graph.revision).toBe(beforeDelete + 1);
    await graph.close();
  });
});
