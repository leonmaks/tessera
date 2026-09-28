import { expect, it } from 'vitest';
import { trustedRenderer, closeDecision, markdownDownloadOptions } from '../../packages/desktop-cli-runtime/src/desktop-policy.js';
it('trusts only the exact app document, never foreign frames or URL tricks', () => {
  expect(trustedRenderer('tessera://app/index.html#page', true)).toBe(true);
  for (const url of ['https://app/', 'tessera://app.evil/', 'tessera://evil@app/', 'file:///index.html', 'tessera://app:80/', 'tessera://app/foreign.html']) expect(trustedRenderer(url, true)).toBe(false);
  expect(trustedRenderer('tessera://app/index.html', false)).toBe(false);
});
it('native export requests a destination only for a trusted Markdown blob', () => {
  expect(markdownDownloadOptions('note.md', 'blob:tessera://app/uuid', false)).toBeUndefined();
  expect(markdownDownloadOptions('note.md', 'file:///private', true)).toBeUndefined();
  expect(markdownDownloadOptions('../note.md', 'blob:tessera://app/uuid', true)).toEqual({ title: 'Экспорт Markdown', defaultPath: '.._note.md', filters: [{ name: 'Markdown', extensions: ['md'] }] });
});
it('allows close only after successful save or explicit discard', async () => {
  expect(await closeDecision('cancel', async () => true)).toBe(false);
  expect(await closeDecision('discard', async () => false)).toBe(true);
  expect(await closeDecision('save', async () => true)).toBe(true);
  expect(await closeDecision('save', async () => false)).toBe(false);
  expect(await closeDecision('save', async () => { throw new Error('worker unavailable'); })).toBe(false);
});
