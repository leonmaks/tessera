import { parentPort } from 'node:worker_threads';
parentPort.on('message', ({ id, payload }) => {
  if (payload === null) parentPort.postMessage({ id, ok: true, value: { snapshot: { revision: 0, pages: [], blocks: [], canUndo: false, canRedo: false } } });
});
