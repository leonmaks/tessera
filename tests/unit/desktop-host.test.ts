import { afterEach, expect, it } from 'vitest';
import { mkdtempSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { startEditorHost, assetPath } from '../../packages/desktop-cli-runtime/src/editor-host.js';

const hosts: Awaited<ReturnType<typeof startEditorHost>>[] = [];
const graph = () => join(mkdtempSync(join(tmpdir(), 'tessera-host-')), 'graph.sqlite');
const start = async (path = graph()) => { const host = await startEditorHost({ path }); hosts.push(host); return host; };
afterEach(async () => { for (const host of hosts.splice(0).reverse()) await host.close(); });

it('persists through worker shutdown and reuses the canonical live host', async () => {
  const path = graph(); const a = await start(path); const b = await start(join(path, '..', 'graph.sqlite'));
  expect(b.owned).toBe(false); expect(b.endpoint).toBe(a.endpoint);
  const saved = await b.request({ operationId: randomUUID(), revision: 0, command: { kind: 'page.create', title: 'Durable' } });
  await b.close(); expect((await a.request(null)).snapshot.pages).toEqual(saved.snapshot.pages);
  await a.close(); expect(existsSync(`${path}.lock`)).toBe(false);
  const reopened = await start(path); expect((await reopened.request(null)).snapshot.pages).toEqual(saved.snapshot.pages);
});
it('does not steal a legacy live PID lock', async () => {
  const path = graph(); writeFileSync(`${path}.lock`, String(process.pid));
  await expect(start(path)).rejects.toThrow(/already open|locked/i);
  expect(readFileSync(`${path}.lock`, 'utf8')).toBe(String(process.pid));
});
it('recovers a dead legacy owner but preserves a replacement lock during close', async () => {
  const path = graph(); const dead = spawnSync(process.execPath, ['-e', '']);
  writeFileSync(`${path}.lock`, String(dead.pid));
  const host = await start(path);
  expect((await host.request(null)).snapshot.revision).toBe(0);
  writeFileSync(`${path}.lock`, String(process.pid));
  await host.close(); expect(readFileSync(`${path}.lock`, 'utf8')).toBe(String(process.pid));
});
it('rejects unauthorized and malformed requests without revisions', async () => {
  const host = await start();
  expect((await fetch(host.endpoint, { method: 'POST', body: 'null' })).status).toBe(403);
  await expect(host.request({ datoms: [] })).rejects.toThrow();
  expect((await host.request(null)).snapshot.revision).toBe(0);
});
it('cleans partial startup and bounds unavailable worker requests', async () => {
  const path = graph();
  await expect(startEditorHost({ path, workerEntry: new URL('file:///missing-tessera-worker.mjs'), timeoutMs: 100 })).rejects.toThrow();
  expect(existsSync(`${path}.lock`)).toBe(false);
});
it('rejects malformed worker messages and releases startup ownership', async () => {
  const path = graph();
  await expect(startEditorHost({ path, workerEntry: new URL('../fixtures/desktop/malformed-worker.mjs', import.meta.url) })).rejects.toThrow('Malformed');
  expect(existsSync(`${path}.lock`)).toBe(false);
});
it.each(['stalled', 'crashing'])('worker failure: %s worker never acknowledges a failed save', async kind => {
  const path = graph();
  const host = await startEditorHost({ path, workerEntry: new URL(`../fixtures/desktop/${kind}-worker.mjs`, import.meta.url), timeoutMs: 200 }); hosts.push(host);
  await expect(host.request({ operationId: randomUUID(), revision: 0, command: { kind: 'page.create', title: 'Unacknowledged' } })).rejects.toThrow();
  await host.close(); expect(existsSync(`${path}.lock`)).toBe(false);
});
it('serves only rooted assets', () => {
  const root = join(tmpdir(), 'assets');
  expect(assetPath(root, '/index.html')).toBe(join(root, 'index.html'));
  for (const path of ['/../secret', '/%2e%2e/secret', '/C:/secret', '/a%5c..%5c..%5csecret', '/%00', '.. ', '/.. /secret']) expect(() => assetPath(root, path)).toThrow();
});
