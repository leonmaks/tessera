import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { After, Given, When, Then } from '@cucumber/cucumber';
import { createEditorRuntime } from '../../../packages/graph-worker/src/editor-runtime.js';

interface EditorWorld { runtime?: ReturnType<typeof createEditorRuntime>; path?: string; block?: string }
Given('a local editor graph with a page and a block', async function (this: EditorWorld) {
  this.path = join(mkdtempSync(join(tmpdir(), 'tessera-bdd-')), 'graph.sqlite');
  this.runtime = createEditorRuntime(this.path);
  const page = await this.runtime.execute({ operationId: randomUUID(), revision: 0, command: { kind: 'page.create', title: 'Notes' } });
  const block = await this.runtime.execute({ operationId: randomUUID(), revision: page.snapshot.revision, command: { kind: 'block.insert', parent: page.focus, content: '' } });
  assert.ok(block.focus); this.block = block.focus;
});
When('I save the block text as {string}', async function (this: EditorWorld, content: string) {
  const state = await this.runtime!.read();
  await this.runtime!.execute({ operationId: randomUUID(), revision: state.revision, command: { kind: 'block.update', uuid: this.block, content } });
});
When('reopen the local editor graph', async function (this: EditorWorld) {
  await this.runtime!.close(); this.runtime = createEditorRuntime(this.path!);
});
Then('the saved editor block contains {string}', async function (this: EditorWorld, content: string) {
  assert.equal((await this.runtime!.read()).blocks.find(block => block.uuid === this.block)?.content, content);
});
After({ tags: '@working-editor' }, async function (this: EditorWorld) { await this.runtime?.close(); });
