import { expect, test } from '@playwright/test';

test('@phase-07 Enter commits a semantic split', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Название новой страницы' }).fill('Split ' + Date.now());
  await page.getByRole('button', { name: 'Создать страницу' }).click();
  await page.getByRole('button', { name: 'Добавить блок' }).click();
  const blocks = page.getByRole('textbox', { name: 'Текст блока' });
  await blocks.first().fill('Hello world');
  await blocks.first().press('Home'); await blocks.first().press('Enter');
  await expect(blocks).toHaveCount(2);
  await expect(blocks.nth(0)).toHaveValue('');
  await expect(blocks.nth(1)).toHaveValue('Hello world');
});

test('@phase-07 collapse is renderer-local', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Название новой страницы' }).fill('Collapse ' + Date.now());
  await page.getByRole('button', { name: 'Создать страницу' }).click();
  await page.getByRole('button', { name: 'Добавить блок' }).click();
  const blocks = page.getByRole('textbox', { name: 'Текст блока' });
  await blocks.first().fill('Parent'); await blocks.first().press('End'); await blocks.first().press('Enter');
  await blocks.nth(1).fill('Child'); await blocks.nth(1).press('Tab');
  await expect(page.getByTestId('block-row').nth(1)).toHaveAttribute('data-depth', '1');
  const read = async () => (await page.request.post('/local/editor', { data: 'null', headers: { 'Content-Type': 'application/json' } })).json();
  const before = await read();
  await page.getByRole('button', { name: 'Свернуть блок' }).first().click();
  await expect(blocks).toHaveCount(1);
  expect((await read()).snapshot).toEqual(before.snapshot);
  await page.getByRole('button', { name: 'Развернуть блок' }).first().click();
  await expect(blocks.nth(1)).toHaveValue('Child');
});

test('@phase-07 backlink panel is derived from the worker semantic projection', async ({ page }) => {
  await page.goto('/');
  const suffix = Date.now().toString();
  await page.getByRole('textbox', { name: 'Название новой страницы' }).fill(`Architecture ${suffix}`);
  await page.getByRole('button', { name: 'Создать страницу' }).click();
  await page.getByRole('textbox', { name: 'Название новой страницы' }).fill(`Notes ${suffix}`);
  await page.getByRole('button', { name: 'Создать страницу' }).click();
  await page.getByRole('button', { name: 'Добавить блок' }).click();
  await page.getByRole('textbox', { name: 'Текст блока' }).fill(`See [[Architecture ${suffix}]]`);
  await page.getByRole('textbox', { name: 'Текст блока' }).press('Tab');
  await page.getByRole('link', { name: `Architecture ${suffix}` }).click();
  await expect(page.getByRole('region', { name: 'Связанные ссылки' })).toContainText(`See [[Architecture ${suffix}]]`);
});
