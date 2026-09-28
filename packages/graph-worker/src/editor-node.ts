import { parentPort, workerData } from 'node:worker_threads';
import { createEditorRuntime } from './editor-runtime.js';
import { z } from 'zod';

const data = z.strictObject({ path: z.string() }).parse(workerData);
const runtime = createEditorRuntime(data.path);
const schema = z.union([z.strictObject({ id: z.string(), payload: z.unknown() }), z.strictObject({ id: z.string(), close: z.literal(true) })]);
parentPort?.on('message', async (raw: unknown) => {
  const request = schema.safeParse(raw);
  if (!request.success) return;
  const { id } = request.data;
  try {
    if ('close' in request.data) { await runtime.close(); parentPort?.postMessage({ id, ok: true, value: null }); parentPort?.close(); return; }
    const { payload } = request.data;
    const value = payload === null ? { snapshot: await runtime.read() } : await runtime.execute(payload);
    parentPort?.postMessage({ id, ok: true, value });
  } catch (error) {
    parentPort?.postMessage({ id, ok: false, error: error instanceof Error ? error.message : 'Worker error' });
  }
});
