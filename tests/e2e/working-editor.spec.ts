import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const errors: string[] = [];
    Object.defineProperty(window, '__tesseraTestErrors', { value: errors });
    window.addEventListener('error', event => errors.push(event.message));
  });
});
test.afterEach(async ({ page }) => {
  expect(await page.evaluate(() => Reflect.get(window, '__tesseraTestErrors'))).toEqual([]);
});

test('Escape cancels a page rename without committing it', async ({ page }) => {
  await page.goto('/');
  const title = `Cancel ${Date.now()}`;
  await page.getByRole('textbox', { name: 'Название новой страницы' }).fill(title);
  await page.getByRole('button', { name: 'Создать страницу' }).click();
  const heading = page.getByRole('textbox', { name: 'Название страницы', exact: true });
  await expect(heading).toHaveValue(title);
  await heading.fill('Accidental rename'); await heading.press('Escape');
  await expect(heading).toHaveValue(title);
  await page.reload(); await expect(heading).toHaveValue(title);
});

test('failed save retains draft and explicit retry persists it', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Название новой страницы' }).fill(`Recovery ${Date.now()}`);
  await page.getByRole('button', { name: 'Создать страницу' }).click();
  await page.getByRole('button', { name: 'Добавить блок' }).click();
  const block = page.getByRole('textbox', { name: 'Текст блока' });
  await page.route('**/local/editor', route => route.abort('failed'));
  await block.fill('Черновик не должен пропасть');
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(block).toHaveValue('Черновик не должен пропасть');
  await page.unroute('**/local/editor');
  await page.getByRole('button', { name: 'Повторить сохранение' }).click();
  await expect(page.getByRole('status')).toHaveText('Все изменения сохранены');
  await page.reload(); await expect(block).toHaveValue('Черновик не должен пропасть');
});

test('another tab sees committed text and a stale save keeps its draft', async ({ page, context }) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Название новой страницы' }).fill(`Tabs ${Date.now()}`);
  await page.getByRole('button', { name: 'Создать страницу' }).click();
  await page.getByRole('button', { name: 'Добавить блок' }).click();
  const block = page.getByRole('textbox', { name: 'Текст блока' });
  await block.fill('Исходный текст');
  await expect(page.getByRole('status')).toHaveText('Все изменения сохранены');
  const second = await context.newPage(); await second.goto(page.url());
  const other = second.getByRole('textbox', { name: 'Текст блока' });
  await expect(other).toHaveValue('Исходный текст');
  await block.fill('Изменение первой вкладки');
  await expect(page.getByRole('status')).toHaveText('Все изменения сохранены');
  await expect(other).toHaveValue('Изменение первой вкладки');
  // Hold this tab's read-only polling at a known revision to deterministically test a stale writer.
  const snapshot = await (await second.request.post('/local/editor', { data: 'null', headers: { 'Content-Type': 'application/json' } })).json();
  await second.route('**/local/editor', async route => {
    if (route.request().postData() === 'null') await route.fulfill({ json: snapshot }); else await route.continue();
  });
  await block.fill('Новое подтверждённое изменение');
  await expect(page.getByRole('status')).toHaveText('Все изменения сохранены');
  await other.fill('Конфликтующий черновик');
  await expect(second.getByRole('alert')).toContainText('STALE');
  await expect(other).toHaveValue('Конфликтующий черновик');
  await expect(block).toHaveValue('Новое подтверждённое изменение');
  await second.unroute('**/local/editor');
  await second.getByRole('button', { name: 'Повторить сохранение' }).click();
  await expect(second.getByRole('status')).toHaveText('Все изменения сохранены');
  await expect(block).toHaveValue('Конфликтующий черновик');
  await second.close();
});

test('edit, split at caret, indent, collapse/expand, reload, merge and history', async ({ page }) => {
  await page.goto('/');
  const title = `Editor ${Date.now()}`;
  await page.getByRole('textbox', { name: 'Название новой страницы' }).fill(title);
  await page.getByRole('button', { name: 'Создать страницу' }).click();
  await expect(page.getByRole('textbox', { name: 'Название страницы', exact: true })).toHaveValue(title);
  await page.getByRole('button', { name: 'Добавить блок' }).click();
  const blocks = page.getByRole('textbox', { name: 'Текст блока' });
  await blocks.first().fill('Hello world');
  await expect(page.getByRole('status')).toHaveText('Все изменения сохранены');
  await blocks.first().press('Home');
  for (let i = 0; i < 6; i++) await blocks.first().press('ArrowRight');
  await blocks.first().press('Enter');
  await expect(blocks).toHaveCount(2);
  await expect(blocks.nth(0)).toHaveValue('Hello ');
  await expect(blocks.nth(1)).toHaveValue('world');
  await expect(blocks.nth(1)).toBeFocused();
  await blocks.nth(1).press('Tab');
  await expect(page.getByTestId('block-row').nth(1)).toHaveAttribute('data-depth', '1');
  await page.getByRole('button', { name: 'Свернуть блок' }).first().click();
  await expect(blocks).toHaveCount(1);
  await page.getByRole('button', { name: 'Развернуть блок' }).first().click();
  await expect(blocks).toHaveCount(2);
  await page.reload();
  await expect(blocks.nth(1)).toHaveValue('world');
  await expect(page.getByTestId('block-row').nth(1)).toHaveAttribute('data-depth', '1');
  await blocks.nth(1).press('Shift+Tab');
  await expect(page.getByTestId('block-row').nth(1)).toHaveAttribute('data-depth', '0');
  await blocks.nth(1).press('Home'); await blocks.nth(1).press('Backspace');
  await expect(blocks).toHaveCount(1); await expect(blocks.first()).toHaveValue('Hello world');
  await page.getByRole('button', { name: 'Отменить' }).click();
  await expect(blocks).toHaveCount(2);
  await page.getByRole('button', { name: 'Повторить' }).click();
  await expect(blocks).toHaveCount(1);
  await blocks.first().press('End'); await blocks.first().press('Backspace');
  await expect(blocks.first()).toHaveValue('Hello worl');
  await expect(page.getByRole('status')).toHaveText('Все изменения сохранены');
});

test('pages navigate, rename, search text, select and move blocks, and export', async ({ page }) => {
  await page.goto('/');
  const title = `Pages ${Date.now()}`;
  for (const name of [title, `${title} second`]) {
    await page.getByRole('textbox', { name: 'Название новой страницы' }).fill(name);
    await page.getByRole('button', { name: 'Создать страницу' }).click();
    await expect(page.getByRole('textbox', { name: 'Название страницы', exact: true })).toHaveValue(name);
  }
  await page.getByRole('button', { name: 'Добавить блок' }).click();
  await page.getByRole('textbox', { name: 'Текст блока' }).fill('Уникальная заметка');
  await expect(page.getByRole('status')).toHaveText('Все изменения сохранены');
  await page.getByRole('button', { name: 'Выбрать блок', exact: true }).click();
  await page.getByRole('combobox', { name: 'Переместить на страницу' }).selectOption({ label: title });
  await expect(page.getByRole('textbox', { name: 'Текст блока' })).toHaveCount(0);
  await page.getByRole('navigation').getByRole('button', { name: title, exact: false }).first().click();
  await expect(page.getByRole('textbox', { name: 'Текст блока' })).toHaveValue('Уникальная заметка');
  const heading = page.getByRole('textbox', { name: 'Название страницы', exact: true });
  await heading.fill(`${title} renamed`); await heading.press('Enter');
  await expect(heading).toHaveValue(`${title} renamed`);
  await expect(page.getByRole('status')).toHaveText('Все изменения сохранены');
  const download = page.waitForEvent('download'); await page.getByRole('button', { name: 'Markdown' }).click();
  const downloaded = await download;
  expect(downloaded.suggestedFilename()).toBe(`${title} renamed.md`);
  expect(await readFile((await downloaded.path())!, 'utf8')).toBe(`# ${title} renamed\n\n- Уникальная заметка\n`);
  await page.getByRole('textbox', { name: 'Поиск' }).fill('Уникальная');
  await expect(page.getByRole('navigation').getByRole('button')).toHaveCount(1);
});

test('multi-select deletion is reversible and the editor fits desktop and mobile', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Название новой страницы' }).fill('Планы на неделю');
  await page.getByRole('button', { name: 'Создать страницу' }).click();
  await expect(page.getByRole('textbox', { name: 'Название страницы', exact: true })).toHaveValue('Планы на неделю');
  const blocks = page.getByRole('textbox', { name: 'Текст блока' });
  for (const content of ['Собрать идеи для нового проекта', 'Продумать структуру и записать первые шаги', 'Оставить время на чтение и прогулки']) {
    const count = await blocks.count();
    await page.getByRole('button', { name: 'Добавить блок' }).click();
    await expect(blocks).toHaveCount(count + 1);
    await expect(blocks.last()).toBeFocused();
    await blocks.last().fill(content);
    await expect(page.getByRole('status')).toHaveText('Все изменения сохранены');
  }
  await blocks.nth(1).press('Tab');
  await expect(page.getByTestId('block-row').nth(1)).toHaveAttribute('data-depth', '1');
  const bullets = page.getByRole('button', { name: 'Выбрать блок', exact: true });
  await bullets.nth(0).click(); await bullets.nth(2).click({ modifiers: ['Control'] });
  await page.getByRole('button', { name: 'Удалить', exact: true }).click();
  await expect(blocks).toHaveCount(0);
  await page.getByRole('button', { name: 'Отменить', exact: false }).click();
  await expect(blocks).toHaveCount(3);
  await expect(blocks.nth(1)).toHaveValue('Продумать структуру и записать первые шаги');
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: '.tmp/tessera-editor-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect.poll(() => blocks.evaluateAll(elements => elements.every(element => element.scrollHeight <= element.clientHeight))).toBe(true);
  await page.screenshot({ path: '.tmp/tessera-editor-mobile.png', fullPage: true });
});

test('drag preserves block identity; Shift+Enter and Delete edit text without freezing', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Название новой страницы' }).fill(`Drag ${Date.now()}`);
  await page.getByRole('button', { name: 'Создать страницу' }).click();
  await page.getByRole('button', { name: 'Добавить блок' }).click();
  const blocks = page.getByRole('textbox', { name: 'Текст блока' });
  await blocks.first().fill('First'); await blocks.first().press('End'); await blocks.first().press('Enter');
  await expect(blocks).toHaveCount(2); await expect(blocks.last()).toBeFocused();
  await blocks.last().fill('Second'); await expect(page.getByRole('status')).toHaveText('Все изменения сохранены');
  const rows = page.getByTestId('block-row');
  const id = await rows.first().getAttribute('data-uuid');
  await page.getByRole('button', { name: 'Выбрать блок', exact: true }).first().dragTo(rows.last());
  await expect(blocks.first()).toHaveValue('Second');
  await expect(rows.last()).toHaveAttribute('data-uuid', id!);
  await blocks.last().press('End'); await blocks.last().press('Shift+Enter'); await blocks.last().pressSequentially('line two');
  await expect(blocks.last()).toHaveValue('First\nline two');
  await blocks.last().press('Control+Home'); await blocks.last().press('Delete');
  await expect(blocks.last()).toHaveValue('irst\nline two');
  await blocks.first().press('End'); await blocks.first().press('Delete');
  await expect(blocks).toHaveCount(1); await expect(blocks.first()).toHaveValue('Secondirst\nline two');
  await expect(page.getByRole('status')).toHaveText('Все изменения сохранены');
  await page.reload(); await expect(blocks.first()).toHaveValue('Secondirst\nline two');
});
