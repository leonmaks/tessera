import { test, expect, _electron as electron, chromium } from '@playwright/test';
import type { Page } from '@playwright/test';
import { createServer } from 'vite';
import { mkdtempSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { editorReplySchema } from '@tessera-ts/domain';

async function scenario(page: Page) {
  await page.getByRole('textbox', { name: 'Название новой страницы' }).fill('Parity');
  await page.getByRole('button', { name: 'Создать страницу' }).click();
  await page.getByRole('button', { name: 'Добавить блок' }).click();
  const blocks = page.getByRole('textbox', { name: 'Текст блока' });
  await blocks.fill('Hello world'); await blocks.press('Home');
  for (let i = 0; i < 6; i++) await blocks.press('ArrowRight');
  await blocks.press('Enter'); await expect(blocks).toHaveCount(2);
  await expect(blocks.last()).toBeFocused(); await blocks.last().press('Tab');
  await expect(page.getByTestId('block-row').last()).toHaveAttribute('data-depth', '1');
  const read = async () => editorReplySchema.parse(await page.evaluate(async () => (await fetch('/local/editor', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: 'null' })).json())).snapshot;
  const before = await read();
  await page.getByRole('button', { name: 'Свернуть блок' }).first().click(); await expect(blocks).toHaveCount(1);
  expect((await read()).revision).toBe(before.revision);
  await page.getByRole('button', { name: 'Развернуть блок' }).first().click();
  await page.getByRole('button', { name: 'Отменить' }).click();
  await expect(page.getByTestId('block-row').last()).toHaveAttribute('data-depth', '0');
  await page.getByRole('button', { name: 'Повторить' }).click();
  await expect(page.getByTestId('block-row').last()).toHaveAttribute('data-depth', '1');
  await page.getByRole('textbox', { name: 'Название новой страницы' }).fill('Destination');
  await page.getByRole('button', { name: 'Создать страницу' }).click();
  await expect(page.getByRole('textbox', { name: 'Название страницы', exact: true })).toHaveValue('Destination');
  await page.getByRole('navigation').getByRole('button', { name: 'Parity' }).click();
  await page.getByRole('button', { name: 'Выбрать блок', exact: true }).first().click();
  await page.getByRole('combobox', { name: 'Переместить на страницу' }).selectOption({ label: 'Destination' });
  await expect(blocks).toHaveCount(0);
  await page.getByRole('textbox', { name: 'Поиск' }).fill('world');
  await expect(page.getByRole('navigation').getByRole('button')).toHaveCount(1);
  await page.getByRole('navigation').getByRole('button').click();
  await expect(blocks).toHaveCount(2);
  const state = await read();
  const names = new Map([...state.pages, ...state.blocks].map(entity => [entity.uuid, entity.content]));
  return { revision: state.revision, pages: state.pages.map(p => p.content).sort(), blocks: state.blocks.map(b => ({ content: b.content, parent: names.get(b.parent), page: names.get(b.page) })).sort((a, b) => a.content.localeCompare(b.content)) };
}
test('cross-shell: identical editing, history, movement, search, collapse and export', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'tessera-cross-shell-'));
  const prior = process.env.TESSERA_GRAPH_PATH; process.env.TESSERA_GRAPH_PATH = join(dir, 'web.sqlite');
  const server = await createServer({ configFile: resolve('vite.config.ts'), root: resolve('apps/web'), server: { host: '127.0.0.1', port: 0 } });
  if (prior === undefined) delete process.env.TESSERA_GRAPH_PATH; else process.env.TESSERA_GRAPH_PATH = prior;
  await server.listen();
  const browser = await chromium.launch();
  const app = await electron.launch({ args: [resolve('dist/desktop/main.mjs')], env: { ...process.env, TESSERA_USER_DATA: join(dir, 'desktop') } });
  try {
    const web = await browser.newPage(); await web.goto(server.resolvedUrls!.local[0]!);
    const desktop = await app.firstWindow();
    expect(await scenario(desktop)).toEqual(await scenario(web));
    const output = join(dir, 'desktop.md');
    await app.evaluate(({ session }, output) => { session.defaultSession.once('will-download', (_event, item) => item.setSavePath(output)); }, output);
    await desktop.getByRole('button', { name: 'Markdown' }).click();
    const download = web.waitForEvent('download'); await web.getByRole('button', { name: 'Markdown' }).click();
    const downloaded = await download;
    await expect.poll(() => { try { return readFileSync(output, 'utf8'); } catch { return ''; } }).toBe(readFileSync((await downloaded.path())!, 'utf8'));
  } finally { try { await app.evaluate(({ app }) => app.exit()); } catch { /* closed */ } await browser.close(); await server.close(); }
});
