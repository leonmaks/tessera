import { app, BrowserWindow, dialog, ipcMain, Menu, protocol, session } from 'electron';
import { readFile } from 'node:fs/promises';
import { join, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { startEditorHost, assetPath } from '@tessera-ts/desktop-cli-runtime/editor-host';
import type { EditorHost } from '@tessera-ts/desktop-cli-runtime/editor-host';
import { trustedRenderer, closeDecision, markdownDownloadOptions } from '@tessera-ts/desktop-cli-runtime/desktop-policy';

app.setName('Tessera');
if (process.env.TESSERA_USER_DATA) app.setPath('userData', resolve(process.env.TESSERA_USER_DATA));
protocol.registerSchemesAsPrivileged([{ scheme: 'tessera', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } }]);
const root = fileURLToPath(new URL('.', import.meta.url));
let window: BrowserWindow | undefined, host: EditorHost | undefined;
let startupError = 'Graph runtime unavailable';
let quitting = false, checkingClose = false;
const replySchema = z.strictObject({ id: z.uuid(), dirty: z.boolean(), saved: z.boolean() });
const waiting = new Map<string, (reply: z.infer<typeof replySchema>) => void>();
ipcMain.on('tessera:close-reply', (event, raw: unknown) => {
  if (!window || event.sender !== window.webContents || event.senderFrame !== event.sender.mainFrame || !trustedRenderer(event.senderFrame.url, true)) return;
  const reply = replySchema.safeParse(raw); if (reply.success) waiting.get(reply.data.id)?.(reply.data);
});
async function inspectDrafts(action: 'inspect' | 'save') {
  const id = randomUUID();
  return new Promise<z.infer<typeof replySchema>>((done, reject) => {
    const timer = setTimeout(() => { waiting.delete(id); reject(new Error('Редактор не ответил. Окно оставлено открытым.')); }, 20000);
    waiting.set(id, reply => { clearTimeout(timer); waiting.delete(id); done(reply); });
    window!.webContents.send('tessera:close-request', { id, action });
  });
}
async function requestClose() {
  if (checkingClose || quitting) return;
  checkingClose = true;
  window?.setEnabled(false);
  try {
    const state = await inspectDrafts('inspect');
    let allow = !state.dirty;
    if (state.dirty) {
      const answer = await dialog.showMessageBox(window!, { type: 'question', title: 'Tessera', message: 'Сохранить изменения перед выходом?', buttons: ['Сохранить', 'Отмена', 'Не сохранять'], defaultId: 0, cancelId: 1, noLink: true });
      allow = await closeDecision((['save', 'cancel', 'discard'] as const)[answer.response] ?? 'cancel', async () => (await inspectDrafts('save')).saved);
    }
    if (!allow) return;
    await host?.close();
    quitting = true; window?.destroy(); app.quit();
  } catch (error) { await dialog.showMessageBox(window!, { type: 'error', message: String(error), title: 'Tessera — не удалось закрыть' }); }
  finally { checkingClose = false; if (window && !window.isDestroyed()) window.setEnabled(true); }
}
if (!app.requestSingleInstanceLock()) { app.quit(); }
else {
  app.on('second-instance', () => { if (window?.isMinimized()) window.restore(); window?.show(); window?.focus(); });
  app.on('before-quit', event => { if (!quitting && window) { event.preventDefault(); void requestClose(); } });
  app.on('window-all-closed', () => { if (quitting) app.quit(); });
  void app.whenReady().then(async () => {
    const ses = session.defaultSession;
    ses.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
    ses.setPermissionCheckHandler(() => false);
    ses.webRequest.onBeforeRequest((details, callback) => { callback({ cancel: !details.url.startsWith('tessera://app/') && !details.url.startsWith('blob:tessera://app/') && !details.url.startsWith('devtools://') }); });
    const csp = "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self'; object-src 'none'; base-uri 'none'; frame-src 'none'; form-action 'none'";
    await ses.protocol.handle('tessera', async request => {
      try {
        const url = new URL(request.url);
        if (url.hostname !== 'app' || url.port || url.username || url.password) return new Response('Forbidden', { status: 403 });
        if (url.pathname === '/local/editor') {
          if (!host) return Response.json({ error: startupError }, { status: 503 });
          const origin = request.headers.get('origin');
          if (url.search || (origin && origin !== 'tessera://app')) return new Response('Forbidden origin', { status: 403 });
          if (request.method !== 'POST' || request.headers.get('content-type') !== 'application/json') return new Response('JSON POST required', { status: 405 });
          const text = await request.text(); if (Buffer.byteLength(text) > 1_000_000) return new Response('Too large', { status: 413 });
          return Response.json(await host.request(JSON.parse(text)), { headers: { 'Cache-Control': 'no-store' } });
        }
        if (request.method !== 'GET') return new Response('Method not allowed', { status: 405 });
        const path = assetPath(join(root, 'web'), url.pathname === '/' ? '/index.html' : url.pathname);
        const type = ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' } as Record<string, string>)[extname(path)] ?? 'application/octet-stream';
        return new Response(await readFile(path), { headers: { 'Content-Type': type, 'Content-Security-Policy': csp, 'X-Content-Type-Options': 'nosniff' } });
      } catch (error) { return Response.json({ error: String(error) }, { status: 400 }); }
    });
    window = new BrowserWindow({ title: 'Tessera', width: 1280, height: 850, minWidth: 700, minHeight: 500, backgroundColor: '#f8f7f4', webPreferences: { preload: join(root, 'preload.cjs'), contextIsolation: true, sandbox: true, nodeIntegration: false, webSecurity: true, webviewTag: false } });
    window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
    window.webContents.on('will-navigate', (event, url) => { if (!trustedRenderer(url, true)) event.preventDefault(); });
    window.webContents.on('will-attach-webview', event => event.preventDefault());
    window.on('close', event => { if (!quitting) { event.preventDefault(); void requestClose(); } });
    ses.on('will-download', (_event, item, contents) => {
      const options = markdownDownloadOptions(item.getFilename(), item.getURL(), contents === window?.webContents && trustedRenderer(contents.getURL(), true));
      if (!options) { item.cancel(); return; }
      item.setSaveDialogOptions(options);
      item.on('done', (_event, state) => { if (state === 'interrupted') void dialog.showMessageBox(window!, { type: 'error', message: 'Не удалось сохранить Markdown' }); });
    });
    Menu.setApplicationMenu(Menu.buildFromTemplate([
      { label: 'Файл', submenu: [{ label: 'Расположение данных', click: () => { void dialog.showMessageBox(window!, { message: 'Граф Tessera', detail: host?.path ?? 'Граф недоступен' }); } }, { type: 'separator' }, { label: 'Выход', accelerator: 'Alt+F4', click: () => { void requestClose(); } }] },
      { label: 'Правка', submenu: [{ role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' }] },
      { label: 'Вид', submenu: [{ role: 'resetZoom' }, { role: 'zoomIn' }, { role: 'zoomOut' }, { role: 'togglefullscreen' }] }
    ]));
    try { host = await startEditorHost({ path: process.env.TESSERA_GRAPH_PATH || join(app.getPath('userData'), 'graphs/default/graph.sqlite'), workerEntry: new URL('./worker.mjs', import.meta.url) }); }
    catch (error) { startupError = `Не удалось открыть граф: ${String(error)}. Проверьте доступ к файлу или закройте приложение, уже открывшее этот граф.`; console.error('Tessera graph startup failed:', error); }
    await window.loadURL('tessera://app/index.html');
  }).catch(error => { console.error(error); dialog.showErrorBox('Tessera — ошибка запуска', String(error)); void (host?.close() ?? Promise.resolve()).finally(() => { quitting = true; app.quit(); }); });
}
