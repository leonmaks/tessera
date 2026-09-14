import assert from "node:assert/strict";
import { Given, Then, When } from "@cucumber/cucumber";
import { createRendererStore } from "../../../packages/graph-client/src/index.js";
import type { GraphId, UUID } from "../../../packages/domain/src/index.js";

interface RenderWorld { store?: ReturnType<typeof createRendererStore>; before?: unknown; parent?: UUID; }
const graphId = "00000000-0000-4000-8000-000000000603" as GraphId;
function store(world: RenderWorld): ReturnType<typeof createRendererStore> { if (!world.store) world.store = createRendererStore(); return world.store; }

Given("the renderer cache is at revision {int}", function (this: RenderWorld, revision: number) {
  const current = store(this);
  current.apply({ graphId, rev: revision as never, blocks: [], deleted: [], children: [], affectedResources: [] });
  this.before = current.snapshot();
});
When("a delta for revision {int} arrives", function (this: RenderWorld, revision: number) { store(this).apply({ graphId, rev: revision as never, blocks: [], deleted: [], children: [], affectedResources: [] }); });
Then("the renderer cache is unchanged", function (this: RenderWorld) { assert.equal(store(this).snapshot(), this.before); });
Given("children of {string} are cached at revision {int}", function (this: RenderWorld, parent: string, revision: number) {
  this.parent = parent as UUID;
  store(this).seedChildren(this.parent, [{ uuid: this.parent, order: "a" as never }], revision);
});
When("a children patch for {string} requires base revision {int}", function (this: RenderWorld, parent: string, baseRevision: number) {
  const id = parent as UUID;
  store(this).apply({ graphId, rev: (baseRevision + 2) as never, blocks: [], deleted: [], children: [{ parent: id, baseRev: baseRevision as never, rev: (baseRevision + 2) as never, remove: [], upsert: [] }], affectedResources: [] });
});
Then("children resource {string} is marked stale", function (this: RenderWorld, parent: string) { assert.equal(store(this).snapshot().children[parent]?.stale, true); });
Then("the patch is not speculatively merged", function (this: RenderWorld) { assert.deepEqual(store(this).snapshot().children[this.parent!]?.members, [{ uuid: this.parent, order: "a" }]); });
