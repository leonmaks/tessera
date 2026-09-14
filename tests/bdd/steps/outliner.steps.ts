import assert from "node:assert/strict";
import { Given, Then, When } from "@cucumber/cucumber";
import { createGraphDatabase } from "../../../packages/graph-db/src/index.js";
import { createOutliner } from "../../../packages/outliner/src/index.js";
import type { UUID } from "../../../packages/domain/src/index.js";

interface OutlinerWorld {
  graph?: ReturnType<typeof createGraphDatabase>;
  outliner?: ReturnType<typeof createOutliner>;
  readonly names?: Map<string, UUID>;
  before?: unknown;
  error?: unknown;
}

function uuidPort() {
  let current = 200;
  return { next: () => `00000000-0000-4000-8000-${(++current).toString().padStart(12, "0")}` };
}

function setup(world: OutlinerWorld): { readonly graph: ReturnType<typeof createGraphDatabase>; readonly outliner: ReturnType<typeof createOutliner>; readonly names: Map<string, UUID> } {
  if (!world.graph) {
    const uuid = uuidPort();
    world.graph = createGraphDatabase({ path: ":memory:", clock: { now: () => 1 }, uuid });
    world.outliner = createOutliner({ graph: world.graph, uuid });
    Object.defineProperty(world, "names", { value: new Map<string, UUID>(), configurable: true });
  }
  return { graph: world.graph, outliner: world.outliner!, names: world.names! };
}

async function page(world: OutlinerWorld, name: string): Promise<UUID> {
  const state = setup(world);
  const known = state.names.get(name);
  if (known) return known;
  const created = await state.outliner.createPage(name);
  state.names.set(name, created.uuid);
  return created.uuid;
}

async function block(world: OutlinerWorld, name: string): Promise<UUID> {
  const known = setup(world).names.get(name);
  if (!known) throw new Error(`Unknown outliner block ${name}`);
  return known;
}

async function existingOrImplicitBlock(world: OutlinerWorld, name: string): Promise<UUID> {
  const state = setup(world);
  const known = state.names.get(name);
  if (known) return known;
  const parent = await page(world, "implicit");
  return insert(world, name, { kind: "last-child", parent });
}

async function insert(world: OutlinerWorld, content: string, position: Parameters<ReturnType<typeof createOutliner>["insertBlock"]>[0]["position"]): Promise<UUID> {
  const state = setup(world);
  const created = await state.outliner.insertBlock({ content, position });
  state.names.set(content, created.uuid);
  return created.uuid;
}

Given("a page {string} with sibling blocks {string} and {string}", async function (this: OutlinerWorld, pageName: string, first: string, second: string) {
  const parent = await page(this, pageName);
  await insert(this, first, { kind: "last-child", parent });
  await insert(this, second, { kind: "last-child", parent });
});
Given("a page {string} with sibling blocks {string}", async function (this: OutlinerWorld, pageName: string, only: string) { await insert(this, only, { kind: "last-child", parent: await page(this, pageName) }); });
Given("page {string} contains block {string}", async function (this: OutlinerWorld, pageName: string, content: string) { await insert(this, content, { kind: "last-child", parent: await page(this, pageName) }); });
Given("block {string} contains block {string}", async function (this: OutlinerWorld, parent: string, content: string) { await insert(this, content, { kind: "last-child", parent: await existingOrImplicitBlock(this, parent) }); });
Given("page {string} exists", async function (this: OutlinerWorld, pageName: string) { await page(this, pageName); });

When("I insert block {string} after {string}", async function (this: OutlinerWorld, content: string, anchor: string) { await insert(this, content, { kind: "after", block: await block(this, anchor) }); });
When("I move block {string} to page {string}", async function (this: OutlinerWorld, content: string, pageName: string) { const state = setup(this); await state.outliner.moveBlock(await block(this, content), { kind: "last-child", parent: await page(this, pageName) }); });
When("I try to move block {string} under block {string}", async function (this: OutlinerWorld, content: string, parent: string) { const state = setup(this); this.before = await state.outliner.snapshot(); try { await state.outliner.moveBlock(await block(this, content), { kind: "last-child", parent: await block(this, parent) }); } catch (error) { this.error = error; } });
When("I indent block {string}", async function (this: OutlinerWorld, content: string) { await setup(this).outliner.indent([await block(this, content)]); });
When("I outdent block {string}", async function (this: OutlinerWorld, content: string) { await setup(this).outliner.outdent([await block(this, content)]); });
When("I split block {string} at offset {int}", async function (this: OutlinerWorld, content: string, offset: number) { const state = setup(this); const split = await state.outliner.splitBlock({ uuid: await block(this, content), offset }); state.names.set(content.slice(0, offset), split.left); state.names.set(content.slice(offset), split.right); });
When("I merge block {string} with its previous block", async function (this: OutlinerWorld, content: string) { await setup(this).outliner.mergeWithPrevious(await block(this, content)); });
When("I delete block {string}", async function (this: OutlinerWorld, content: string) { await setup(this).outliner.deleteBlock(await block(this, content)); });
When("I undo the last outliner operation", async function (this: OutlinerWorld) { await setup(this).outliner.undo(); });

Then("the children of page {string} are {string}", async function (this: OutlinerWorld, pageName: string, contents: string) { const snapshot = await setup(this).outliner.snapshot(); assert.deepEqual(snapshot.children(await page(this, pageName)).map(node => node.content), contents === "" ? [] : contents.split(",")); });
Then("the children of block {string} are {string}", async function (this: OutlinerWorld, content: string, contents: string) { const snapshot = await setup(this).outliner.snapshot(); assert.deepEqual(snapshot.children(await block(this, content)).map(node => node.content), contents === "" ? [] : contents.split(",")); });
Then("block {string} belongs to page {string}", async function (this: OutlinerWorld, content: string, pageName: string) { assert.equal((await setup(this).outliner.snapshot()).block(await block(this, content)).page, await page(this, pageName)); });
Then("block {string} remains a child of block {string}", async function (this: OutlinerWorld, child: string, parent: string) { assert.equal((await setup(this).outliner.snapshot()).block(await block(this, child)).parent, await block(this, parent)); });
Then("the UUIDs of {string} and {string} are unchanged", async function (this: OutlinerWorld, first: string, second: string) { const snapshot = await setup(this).outliner.snapshot(); assert.equal(snapshot.block(await block(this, first)).uuid, await block(this, first)); assert.equal(snapshot.block(await block(this, second)).uuid, await block(this, second)); });
Then("the operation fails with error {string}", function (this: OutlinerWorld, code: string) { assert.equal((this.error as { code?: string } | undefined)?.code, code); });
Then("the graph snapshot is unchanged", async function (this: OutlinerWorld) { assert.deepEqual(await setup(this).outliner.snapshot(), this.before); });
