import { test, expect, _electron as electron } from '@playwright/test';
import { mkdtempSync, existsSync, readFileSync, mkdirSync, cpSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';
import { startEditorHost } from '@tessera-ts/desktop-cli-runtime/editor-host';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const launchApp = (profile = mkdtempSync(join(tmpdir(), 'tessera-desktop-')), extra: Record<string, string> = {}) => electron.launch({ args: [resolve('dist/desktop/main.mjs')], env: { ...process.env, TESSERA_USER_DATA: profile, ...extra } });
async function cleanup(app: Awaited<ReturnType<typeof launchApp>>) {
  // Emergency test teardown must not wait on a native unsaved-changes dialog.
  try { await app.evaluate(({ app }) => app.exit()); } catch { /* already exited */ }
}
async function seed(app: Awaited<ReturnType<typeof launchApp>>) {
  const page = await app.firstWindow();
  await page.getByRole('textbox', { name: 'Название новой страницы' }).fill('Desktop');
  await page.getByRole('button', { name: 'Создать страницу' }).click();
  await page.getByRole('button', { name: 'Добавить блок' }).click();
  await expect(page.getByRole('textbox', { name: 'Текст блока' })).toHaveCount(1);
  return page;
}

test('SQLite runtime: independent editor saves and restarts', async () => {
  const profile = mkdtempSync(join(tmpdir(), 'tessera-desktop-'));
  const launch = () => electron.launch({ args: [resolve('dist/desktop/main.mjs')], env: { ...process.env, TESSERA_USER_DATA: profile } });
  let app = await launch();
  try {
    let page = await app.firstWindow();
    await page.getByRole('textbox', { name: 'Название новой страницы' }).fill('Electron notes');
    await page.getByRole('button', { name: 'Создать страницу' }).click();
    await page.getByRole('button', { name: 'Добавить блок' }).click();
    await page.getByRole('textbox', { name: 'Текст блока' }).fill('Сохранено в Electron');
    await expect(page.getByRole('status')).toHaveText('Все изменения сохранены');
    await app.close(); app = await launch(); page = await app.firstWindow();
    await expect(page.getByRole('textbox', { name: 'Текст блока' })).toHaveValue('Сохранено в Electron');
  } finally { await cleanup(app); }
});

test('renderer isolation: no Node, external navigation, popups or native content execution', async () => {
  const app = await launchApp();
  try {
    const page = await seed(app);
    await page.getByRole('textbox', { name: 'Текст блока' }).fill('<script>require("node:fs")</script> file:///secret');
    expect(await page.evaluate(() => [typeof Reflect.get(window, 'require'), typeof Reflect.get(window, 'process')])).toEqual(['undefined', 'undefined']);
    expect(await app.evaluate(({ BrowserWindow }) => {
      const contents = BrowserWindow.getAllWindows()[0]!.webContents;
      const read: unknown = Reflect.get(contents, 'getLastWebPreferences');
      if (typeof read !== 'function') throw new Error('Missing preference inspection');
      const prefs = read.call(contents) as Record<string, unknown>;
      return [prefs.sandbox, prefs.contextIsolation, prefs.nodeIntegration, prefs.webSecurity];
    })).toEqual([true, true, false, true]);
    await page.evaluate(() => { window.open('https://example.com'); location.href = 'file:///secret'; });
    await expect(page.getByRole('textbox', { name: 'Текст блока' })).toHaveCount(1);
    expect(app.windows()).toHaveLength(1); expect(page.url()).toContain('tessera://app/');
    expect(await page.evaluate(async () => { try { await fetch('https://example.com'); return true; } catch { return false; } })).toBe(false);
  } finally { await cleanup(app); }
});

test('close: failed save keeps draft, cancel stays open, explicit save survives restart', async () => {
  const profile = mkdtempSync(join(tmpdir(), 'tessera-close-'));
  let app = await launchApp(profile);
  try {
    const page = await seed(app);
    await page.evaluate(() => { Reflect.set(window, '__originalFetch', window.fetch); window.fetch = async () => { throw new Error('simulated offline'); }; });
    await page.getByRole('textbox', { name: 'Текст блока' }).fill('Не потерять черновик');
    await expect(page.getByRole('alert')).toContainText('simulated offline');
    await app.evaluate(({ dialog, BrowserWindow }) => {
      dialog.showMessageBox = async () => ({ response: 0, checkboxChecked: false });
      BrowserWindow.getAllWindows()[0]!.close();
    });
    await expect(page.getByRole('textbox', { name: 'Текст блока' })).toHaveValue('Не потерять черновик');
    await expect(page.getByRole('alert')).toContainText('Error: simulated offline');
    await app.evaluate(({ dialog, BrowserWindow }) => { dialog.showMessageBox = async () => ({ response: 1, checkboxChecked: false }); BrowserWindow.getAllWindows()[0]!.close(); });
    await expect(page.getByRole('textbox', { name: 'Текст блока' })).toHaveValue('Не потерять черновик');
    await page.evaluate(() => { window.fetch = Reflect.get(window, '__originalFetch') as typeof fetch; });
    const closed = app.waitForEvent('close');
    await app.evaluate(({ dialog, BrowserWindow }) => { dialog.showMessageBox = async () => ({ response: 0, checkboxChecked: false }); BrowserWindow.getAllWindows()[0]!.close(); });
    await closed;
    app = await launchApp(profile);
    await expect((await app.firstWindow()).getByRole('textbox', { name: 'Текст блока' })).toHaveValue('Не потерять черновик');
  } finally { await cleanup(app); }
});

test('close: explicit discard loses only unacknowledged draft; title drafts save before exit', async () => {
  const profile = mkdtempSync(join(tmpdir(), 'tessera-discard-'));
  let app = await launchApp(profile);
  try {
    let page = await seed(app);
    await page.getByRole('textbox', { name: 'Текст блока' }).fill('Committed');
    await expect(page.getByRole('status')).toHaveText('Все изменения сохранены');
    await page.evaluate(() => { window.fetch = async () => { throw new Error('offline'); }; });
    await page.getByRole('textbox', { name: 'Текст блока' }).fill('Discard me');
    await expect(page.getByRole('alert')).toBeVisible();
    let closed = app.waitForEvent('close');
    await app.evaluate(({ dialog, BrowserWindow }) => { dialog.showMessageBox = async () => ({ response: 2, checkboxChecked: false }); BrowserWindow.getAllWindows()[0]!.close(); });
    await closed; app = await launchApp(profile); page = await app.firstWindow();
    await expect(page.getByRole('textbox', { name: 'Текст блока' })).toHaveValue('Committed');
    await page.getByRole('textbox', { name: 'Название страницы', exact: true }).fill('Renamed before exit');
    closed = app.waitForEvent('close');
    await app.evaluate(({ dialog, BrowserWindow }) => { dialog.showMessageBox = async () => ({ response: 0, checkboxChecked: false }); BrowserWindow.getAllWindows()[0]!.close(); });
    await closed; app = await launchApp(profile); page = await app.firstWindow();
    await expect(page.getByRole('textbox', { name: 'Название страницы', exact: true })).toHaveValue('Renamed before exit');
  } finally { await cleanup(app); }
});

test('export: native Markdown destination and cancellation', async () => {
  const app = await launchApp();
  const output = join(mkdtempSync(join(tmpdir(), 'tessera-export-')), 'notes.md');
  try {
    const page = await seed(app); await page.getByRole('textbox', { name: 'Текст блока' }).fill('Export content');
    await expect(page.getByRole('status')).toHaveText('Все изменения сохранены');
    await app.evaluate(({ session }, output) => { session.defaultSession.once('will-download', (_event, item) => { item.setSavePath(output); }); }, output);
    await page.getByRole('button', { name: 'Markdown' }).click();
    await expect.poll(() => existsSync(output) && readFileSync(output, 'utf8')).toBe('# Desktop\n\n- Export content\n');
    await app.evaluate(({ session }) => { session.defaultSession.once('will-download', (_event, item) => item.cancel()); });
    await page.getByRole('button', { name: 'Markdown' }).click();
    await expect(page.getByRole('status')).toHaveText('Все изменения сохранены');
    expect(readFileSync(output, 'utf8')).toBe('# Desktop\n\n- Export content\n');
  } finally { await cleanup(app); }
});

test('startup failure: unavailable graph displays an error, never saved', async () => {
  const profile = mkdtempSync(join(tmpdir(), 'tessera-unavailable-'));
  const invalid = join(profile, 'directory.sqlite'); mkdirSync(invalid);
  const app = await launchApp(profile, { TESSERA_GRAPH_PATH: invalid });
  try { const page = await app.firstWindow(); await expect(page.getByRole('alert')).toBeVisible(); await expect(page.getByRole('status')).toHaveText('Не сохранено'); }
  finally { await cleanup(app); }
});

test('ownership: second process activates original instance without another writer', async () => {
  const profile = mkdtempSync(join(tmpdir(), 'tessera-instance-'));
  const app = await launchApp(profile);
  try {
    const page = await seed(app);
    await expect(page.getByRole('status')).toHaveText('Все изменения сохранены');
    const lock = join(profile, 'graphs/default/graph.sqlite.lock'); const before = readFileSync(lock, 'utf8');
    await app.evaluate(({ app }) => { app.once('second-instance', () => { Reflect.set(globalThis, '__activated', true); }); });
    const executable: string = createRequire(import.meta.url)('electron');
    const second = spawn(executable, [resolve('dist/desktop/main.mjs')], { env: { ...process.env, TESSERA_USER_DATA: profile }, windowsHide: true, stdio: 'ignore' });
    await new Promise<void>((done, reject) => { second.once('error', reject); second.once('exit', code => code === 0 ? done() : reject(new Error(`Second launch exited ${code}`))); });
    await expect.poll(() => app.evaluate(() => Reflect.get(globalThis, '__activated'))).toBe(true);
    expect(readFileSync(lock, 'utf8')).toBe(before); expect(app.windows()).toHaveLength(1);
  } finally { await cleanup(app); }
});

test('ownership: explicit existing graph reuses host and does not replace or terminate it', async () => {
  const profile = mkdtempSync(join(tmpdir(), 'tessera-existing-'));
  const host = await startEditorHost({ path: join(profile, 'existing.sqlite') });
  const saved = await host.request({ operationId: randomUUID(), revision: 0, command: { kind: 'page.create', title: 'Existing web graph' } });
  const app = await launchApp(join(profile, 'desktop'), { TESSERA_GRAPH_PATH: host.path });
  try {
    await expect((await app.firstWindow()).getByRole('textbox', { name: 'Название страницы', exact: true })).toHaveValue('Existing web graph');
    await app.close();
    expect((await host.request(null)).snapshot.pages).toEqual(saved.snapshot.pages);
  } finally { await cleanup(app); await host.close(); }
});

test('packaged: offline restart from path with spaces preserves UUIDs, revision and local collapse', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'Tessera packaged '));
  const install = join(dir, 'App with spaces'); cpSync(resolve('dist/releases/Tessera-win32-x64'), install, { recursive: true });
  const profile = join(dir, 'User data');
  const launch = () => electron.launch({ executablePath: join(install, 'Tessera.exe'), cwd: dir, env: { ...process.env, PATH: process.env.SystemRoot + '\\System32', TESSERA_USER_DATA: profile } });
  let app = await launch();
  try {
    let page = await seed(app);
    const blocks = page.getByRole('textbox', { name: 'Текст блока' });
    await blocks.fill('Parent'); await blocks.press('End'); await blocks.press('Enter');
    await expect(blocks).toHaveCount(2); await blocks.last().fill('Child'); await blocks.last().press('Tab');
    await expect(page.getByTestId('block-row').last()).toHaveAttribute('data-depth', '1');
    await expect(page.getByRole('status')).toHaveText('Все изменения сохранены');
    const read = () => page.evaluate(async () => (await (await fetch('/local/editor', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: 'null' })).json()).snapshot);
    const before = await read();
    await page.getByRole('button', { name: 'Свернуть блок' }).first().click(); await expect(blocks).toHaveCount(1);
    expect((await read()).revision).toBe(before.revision);
    await app.close(); app = await launch(); page = await app.firstWindow();
    await expect(page.getByRole('textbox', { name: 'Текст блока' })).toHaveCount(1);
    const after = await read(); expect(after.blocks).toEqual(before.blocks); expect(after.pages).toEqual(before.pages); expect(after.revision).toBe(before.revision);
    expect(await page.evaluate(async () => { try { await fetch('https://example.com'); return true; } catch { return false; } })).toBe(false);
    await page.screenshot({ path: '.tmp/tessera-electron.png' });
  } finally { await cleanup(app); }
});
