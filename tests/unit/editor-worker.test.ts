import { Worker } from 'node:worker_threads';
import { randomUUID } from 'node:crypto';
import { mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { expect, it } from 'vitest';
import { editorReplySchema } from '../../packages/domain/src/editor-protocol.js';

it('reopens acknowledged data after terminating and restarting the actual Node worker', async () => {
  const path = join(mkdtempSync(join(tmpdir(), 'tessera-worker-')), 'graph.sqlite');
  const entry = new URL('../../packages/graph-worker/src/editor-node.ts', import.meta.url).href;
  const start = () => new Worker(`const { register } = await import('tsx/esm/api'); register(); await import(${JSON.stringify(entry)});`, { eval: true, workerData: { path } });
  let worker = start();
  const request = (payload: unknown) => new Promise<ReturnType<typeof editorReplySchema.parse>>((resolve, reject) => {
    const id = randomUUID();
    const message = (raw: { id: string; ok: boolean; value?: unknown; error?: string }) => {
      if (raw.id !== id) return;
      worker.off('message', message); worker.off('error', reject);
      if (!raw.ok) reject(new Error(raw.error)); else { try { resolve(editorReplySchema.parse(raw.value)); } catch (error) { reject(error); } }
    };
    worker.on('message', message); worker.once('error', reject); worker.postMessage({ id, payload });
  });
  try {
    const page = await request({ operationId: randomUUID(), revision: 0, command: { kind: 'page.create', title: 'Durable page' } });
    const saved = await request({ operationId: randomUUID(), revision: page.snapshot.revision, command: { kind: 'block.insert', parent: page.focus, content: 'Сохранено на диске' } });
    await worker.terminate(); worker = start();
    const reopened = await request(null);
    expect(reopened.snapshot.blocks).toEqual(saved.snapshot.blocks);
    expect(reopened.snapshot.pages).toEqual(saved.snapshot.pages);
    expect(reopened.snapshot.revision).toBe(saved.snapshot.revision);
    expect(reopened.snapshot.canUndo).toBe(false);
  } finally { await worker.terminate(); }
}, 15000);
