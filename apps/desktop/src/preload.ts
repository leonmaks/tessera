import { contextBridge, ipcRenderer } from 'electron';
type CloseHandler = (action: 'inspect' | 'save') => Promise<{ dirty: boolean; saved: boolean }>;
let handler: CloseHandler | undefined;
contextBridge.exposeInMainWorld('tesseraDesktop', { onClose(callback: CloseHandler) { handler = callback; } });
ipcRenderer.on('tessera:close-request', (_event, raw: unknown) => {
  if (!raw || typeof raw !== 'object' || !('id' in raw) || !('action' in raw) || typeof raw.id !== 'string' || !/^[0-9a-f-]{36}$/.test(raw.id) || (raw.action !== 'inspect' && raw.action !== 'save')) return;
  const id = raw.id;
  void Promise.resolve(handler?.(raw.action) ?? { dirty: true, saved: false }).then(reply => {
    ipcRenderer.send('tessera:close-reply', { id, dirty: reply.dirty === true, saved: reply.saved === true });
  }).catch(() => ipcRenderer.send('tessera:close-reply', { id, dirty: true, saved: false }));
});
