import assert from "node:assert/strict";
import { Given, Then, When } from "@cucumber/cucumber";
import { createEditorController } from "../../../packages/editor-ui/src/index.js";
import type { EditorIntent } from "../../../packages/editor-ui/src/index.js";
interface World { editor?: ReturnType<typeof createEditorController>; intents?: EditorIntent[]; }
function setup(world: World): { editor: ReturnType<typeof createEditorController>; intents: EditorIntent[] } { if (!world.intents) world.intents = []; if (!world.editor) world.editor = createEditorController({ send: intent => { world.intents!.push(intent); } }); return { editor: world.editor, intents: world.intents }; }
Given("a focused editor block {string} with content {string} and caret {int}", function (this: World, block: string, _content: string, offset: number) { setup(this).editor.focus(block, offset); });
When("the editor receives the Enter key", function (this: World) { setup(this).editor.key("Enter"); });
Then("it sends split intent for block {string} at offset {int}", function (this: World, block: string, offset: number) { assert.deepEqual(setup(this).intents, [{ kind: "split", block, offset }]); });
Given("an expanded editor block {string} with descendants", function (this: World, block: string) { setup(this).editor.focus(block, 0); });
When("the editor collapses block {string}", function (this: World, block: string) { setup(this).editor.collapse(block); });
Then("descendants of {string} are hidden without a graph command", function (this: World, block: string) { const state = setup(this); assert.equal(state.editor.snapshot().collapsed.has(block), true); assert.deepEqual(state.intents, []); });
