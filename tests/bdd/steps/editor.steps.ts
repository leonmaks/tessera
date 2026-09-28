import assert from "node:assert/strict";
import { Given, Then, When } from "@cucumber/cucumber";
import { createEditorController } from "../../../packages/editor-ui/src/index.js";
import type { EditorIntent } from "../../../packages/editor-ui/src/index.js";
interface World { editor?: ReturnType<typeof createEditorController>; intents?: EditorIntent[]; reloads?: string[]; }
function setup(world: World): { editor: ReturnType<typeof createEditorController>; intents: EditorIntent[] } { if (!world.intents) world.intents = []; if (!world.editor) world.editor = createEditorController({ send: intent => { world.intents!.push(intent); }, reloadChildren: parent => { (world.reloads ??= []).push(parent); } }); return { editor: world.editor, intents: world.intents }; }
Given("a focused editor block {string} with content {string} and caret {int}", function (this: World, block: string, _content: string, offset: number) { setup(this).editor.focus(block, offset); });
When("the editor receives the Enter key", function (this: World) { setup(this).editor.key("Enter"); });
Then("it sends split intent for block {string} at offset {int}", function (this: World, block: string, offset: number) { assert.deepEqual(setup(this).intents, [{ kind: "split", block, offset }]); });
Given("an expanded editor block {string} with descendants", function (this: World, block: string) { setup(this).editor.focus(block, 0); });
When("the editor collapses block {string}", function (this: World, block: string) { setup(this).editor.collapse(block); });
Then("descendants of {string} are hidden without a graph command", function (this: World, block: string) { const state = setup(this); assert.equal(state.editor.snapshot().collapsed.has(block), true); assert.deepEqual(state.intents, []); });
Given("editor blocks {string} and {string} are selected", function (this: World, first: string, second: string) { const editor = setup(this).editor; editor.focus(first, 0); editor.select(second, true); });
When("the editor receives the Tab key", function (this: World) { setup(this).editor.key("Tab"); });
Then("it sends indent intent for blocks {string}", function (this: World, blocks: string) { assert.deepEqual(setup(this).intents, [{ kind: "indent", blocks: blocks.split(",") }]); });
Given("an editor with a stale-child reload gateway", function (this: World) { setup(this); });
When("the editor receives a stale child patch for {string}", function (this: World, parent: string) { setup(this).editor.requestReload(parent, true); });
Then("it requests a child reload for {string}", function (this: World, parent: string) { assert.deepEqual(this.reloads, [parent]); });
