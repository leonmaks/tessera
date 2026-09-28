import assert from 'node:assert/strict';
import { Given, When, Then, After } from '@cucumber/cucumber';
import { mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { startEditorHost } from '../../../packages/desktop-cli-runtime/src/editor-host.js';
import { closeDecision, trustedRenderer } from '../../../packages/desktop-cli-runtime/src/desktop-policy.js';
interface DesktopWorld { host: Awaited<ReturnType<typeof startEditorHost>>; second?: Awaited<ReturnType<typeof startEditorHost>>; path: string; choice: 'save' | 'cancel' | 'discard'; allowed: boolean; status: number }
let built = false;
Given('the built Electron desktop client', { timeout: 120000 }, function () {
  if (built) return;
  execFileSync(process.execPath, ['scripts/build-desktop.mjs'], { windowsHide: true });
  execFileSync(process.execPath, ['scripts/package-desktop.mjs'], { windowsHide: true });
  built = true;
});
When('the native desktop scenario {string} runs', { timeout: 120000 }, function (this: DesktopWorld, scenario: string) {
  // Reuse the real black-box Electron acceptance driver, not a mocked BDD graph.
  const cli = createRequire(import.meta.url).resolve('@playwright/test/cli');
  const run = spawnSync(process.execPath, [cli, 'test', '--config', 'playwright.electron.config.ts', '--grep', scenario], { windowsHide: true, encoding: 'utf8', timeout: 110000 });
  assert.equal(run.status, 0, `${run.stdout}\n${run.stderr}`); this.allowed = true;
});
Then('its observable desktop contract passes', function (this: DesktopWorld) { assert.equal(this.allowed, true); });
Given('an isolated desktop graph host', async function (this: DesktopWorld) { this.path = join(mkdtempSync(join(tmpdir(), 'tessera-bdd-desktop-')), 'graph.sqlite'); this.host = await startEditorHost({ path: this.path }); });
When('a desktop page is saved and the host restarts', async function (this: DesktopWorld) { await this.host.request({ operationId: randomUUID(), revision: 0, command: { kind: 'page.create', title: 'Desktop notes' } }); await this.host.close(); this.host = await startEditorHost({ path: this.path }); });
Then('the desktop page remains persisted', async function (this: DesktopWorld) { assert.equal((await this.host.request(null)).snapshot.pages[0]?.content, 'Desktop notes'); });
When('another desktop client opens the same graph', async function (this: DesktopWorld) { this.second = await startEditorHost({ path: this.path }); });
Then('the original writer remains the only owner', function (this: DesktopWorld) { assert.equal(this.host.owned, true); assert.equal(this.second?.owned, false); assert.equal(this.second.endpoint, this.host.endpoint); });
When('an unauthenticated caller requests the graph', async function (this: DesktopWorld) { this.status = (await fetch(this.host.endpoint, { method: 'POST', body: 'null' })).status; });
Then('the desktop request is rejected without changing revision', async function (this: DesktopWorld) { assert.equal(this.status, 403); assert.equal((await this.host.request(null)).snapshot.revision, 0); });
Given('a desktop close choice of {string}', function (this: DesktopWorld, choice: DesktopWorld['choice']) { this.choice = choice; });
When('desktop saving returns {string}', async function (this: DesktopWorld, saved: string) { this.allowed = await closeDecision(this.choice, async () => saved === 'true'); });
Then('desktop closing is {string}', function (this: DesktopWorld, allowed: string) { assert.equal(this.allowed, allowed === 'true'); });
When('a note targets an untrusted native URL', function (this: DesktopWorld) { this.allowed = trustedRenderer('file:///secret', true); });
Then('the desktop navigation is denied', function (this: DesktopWorld) { assert.equal(this.allowed, false); });
After({ tags: '@electron-desktop' }, async function (this: DesktopWorld) { await this.second?.close(); await this.host?.close(); });
