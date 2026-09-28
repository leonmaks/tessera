import { Worker } from 'node:worker_threads';
import { randomBytes, randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import { mkdirSync, openSync, closeSync, readFileSync, writeFileSync, unlinkSync, realpathSync, existsSync } from 'node:fs';
import { dirname, resolve, relative, isAbsolute, basename, sep } from 'node:path';
import { z } from 'zod';
import { editorReplySchema, editorRequestSchema } from '@tessera-ts/domain';
import type { EditorReply } from '@tessera-ts/domain';

export function assetPath(root: string, raw: string): string {
  const decoded = decodeURIComponent(raw);
  if (/[\\:\0]/.test(decoded) || decoded.split('/').some(part => part.startsWith('..'))) throw new Error('Invalid asset path');
  const target = resolve(root, `.${decoded.startsWith('/') ? '' : '/'}${decoded || '/index.html'}`);
  const rel = relative(resolve(root), target);
  if (isAbsolute(rel) || rel === '..' || rel.startsWith(`..${sep}`)) throw new Error('Invalid asset path');
  if (existsSync(target)) {
    const real = relative(realpathSync(root), realpathSync(target));
    if (isAbsolute(real) || real === '..' || real.startsWith(`..${sep}`)) throw new Error('Invalid asset symlink');
  }
  return target;
}
const ownerSchema = z.strictObject({ pid: z.number().int().positive(), token: z.string().regex(/^[a-f0-9]{64}$/), endpoint: z.string().regex(/^http:\/\/127\.0\.0\.1:\d+\/local\/editor$/) });
const messageSchema = z.discriminatedUnion('ok', [z.strictObject({ id: z.string(), ok: z.literal(true), value: z.unknown() }), z.strictObject({ id: z.string(), ok: z.literal(false), error: z.string() })]);
function alive(pid: number) { try { process.kill(pid, 0); return true; } catch (error) { return (error as NodeJS.ErrnoException).code !== 'ESRCH'; } }
export interface EditorHost {
  readonly owned: boolean; readonly endpoint: string; readonly path: string;
  request(payload: unknown): Promise<EditorReply>;
  close(): Promise<void>;
}
/** Transport/lifecycle only. The worker is the sole SQLite owner. */
export async function startEditorHost(options: { path: string; workerEntry?: URL; timeoutMs?: number; keepAlive?: boolean }): Promise<EditorHost> {
  const timeoutMs = options.timeoutMs ?? 15000;
  const input = resolve(options.path); mkdirSync(dirname(input), { recursive: true });
  const path = existsSync(input) ? realpathSync(input) : resolve(realpathSync(dirname(input)), basename(input));
  const lock = `${path}.lock`, token = randomBytes(32).toString('hex');
  let lockContent = String(process.pid);
  function acquire() { const fd = openSync(lock, 'wx', 0o600); try { writeFileSync(fd, lockContent); } finally { closeSync(fd); } }
  const remote = (endpoint: string, credential: string) => async (payload: unknown): Promise<EditorReply> => {
    if (payload !== null) editorRequestSchema.parse(payload);
    const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${credential}` }, body: JSON.stringify(payload), signal: AbortSignal.timeout(timeoutMs), redirect: 'error' });
    const raw: unknown = await response.json();
    if (!response.ok) throw new Error(raw && typeof raw === 'object' && 'error' in raw ? String(raw.error) : 'Graph host failed');
    return editorReplySchema.parse(raw);
  };
  try { acquire(); } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
    const existing = readFileSync(lock, 'utf8');
    let parsed: unknown; try { parsed = JSON.parse(existing); } catch { throw new Error(`Invalid graph lock: ${lock}`); }
    const owner = ownerSchema.safeParse(parsed);
    const pid = owner.success ? owner.data.pid : typeof parsed === 'number' && Number.isSafeInteger(parsed) && parsed > 0 ? parsed : undefined;
    if (!pid) throw new Error(`Invalid graph lock: ${lock}`);
    if (alive(pid)) {
      if (owner.success) {
        const request = remote(owner.data.endpoint, owner.data.token);
        try { await request(null); return { path, owned: false, endpoint: owner.data.endpoint, request, close: async () => {} }; } catch { /* A live PID is never stolen on timeout. */ }
      }
      throw new Error(`Graph is already open (locked by process ${pid}): ${path}`);
    }
    const guard = `${lock}.recovery`; const fd = openSync(guard, 'wx');
    try { if (readFileSync(lock, 'utf8') !== existing) throw new Error('Graph ownership changed; retry'); unlinkSync(lock); acquire(); }
    finally { closeSync(fd); unlinkSync(guard); }
  }
  const release = () => { try { if (readFileSync(lock, 'utf8') === lockContent) unlinkSync(lock); } catch { /* already absent */ } };
  const releaseOnExit = () => release();
  process.once('exit', releaseOnExit);
  let worker: Worker | undefined;
  const server = createServer();
  let closed = false, closing: Promise<void> | undefined, failed: Error | undefined;
  const pending = new Map<string, { resolve(value: unknown): void; reject(error: Error): void; timer: ReturnType<typeof setTimeout> }>();
  const fail = (error: Error) => { failed = error; for (const call of pending.values()) { clearTimeout(call.timer); call.reject(error); } pending.clear(); };
  function call(payload: unknown, close = false): Promise<unknown> {
    if (failed) return Promise.reject(failed);
    const id = randomUUID();
    return new Promise((resolveCall, reject) => {
      const timer = setTimeout(() => { pending.delete(id); reject(new Error('Graph worker request timed out; save outcome unknown')); }, timeoutMs);
      pending.set(id, { resolve: resolveCall, reject, timer });
      worker!.postMessage(close ? { id, close: true } : { id, payload });
    });
  }
  async function close(): Promise<void> {
    if (closing) return closing;
    closed = true;
    closing = (async () => {
      await new Promise<void>(done => {
        if (!server.listening) { done(); return; }
        server.close(() => done());
        server.closeIdleConnections();
        server.closeAllConnections();
      });
      if (worker) { try { await call(null, true); } catch { /* terminate failed worker below */ } await worker.terminate(); }
      release();
      process.off('exit', releaseOnExit);
    })();
    return closing;
  }
  try {
    const entry = options.workerEntry ?? new URL(import.meta.resolve('@tessera-ts/graph-worker/editor-node'));
    const developmentBootstrap = `
      const os = (await import('node:os')).default;
      const originalUserInfo = os.userInfo;
      os.userInfo = function (...args) {
        try { return originalUserInfo.apply(this, args); }
        catch (error) {
          if (process.platform !== 'win32' || error?.info?.syscall !== 'uv_os_get_passwd') throw error;
          return { uid: -1, gid: -1, username: process.env.USERNAME ?? 'unknown', homedir: process.env.USERPROFILE ?? os.homedir(), shell: null };
        }
      };
      const { register } = await import('tsx/esm/api');
      register();
      await import(${JSON.stringify(entry.href)});
    `;
    worker = entry.pathname.endsWith('.ts')
      ? new Worker(developmentBootstrap, { eval: true, workerData: { path } })
      : new Worker(entry, { workerData: { path } });
    if (options.keepAlive === false) worker.unref();
    worker.on('message', (raw: unknown) => {
      const parsed = messageSchema.safeParse(raw);
      if (!parsed.success) { fail(new Error('Malformed graph worker reply')); return; }
      const message = parsed.data, waiting = pending.get(message.id); if (!waiting) return;
      pending.delete(message.id); clearTimeout(waiting.timer);
      if (message.ok) waiting.resolve(message.value); else waiting.reject(new Error(message.error));
    });
    worker.on('error', fail); worker.on('exit', code => fail(new Error(`Graph worker stopped (${code})`)));
    editorReplySchema.parse(await call(null));
    server.requestTimeout = timeoutMs;
    server.headersTimeout = timeoutMs;
    server.setTimeout(timeoutMs, socket => socket.destroy());
    server.on('request', (req, res) => {
      const answer = (status: number, value: unknown) => { res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(value)); };
      if (closed) { answer(503, { error: 'Graph host closing' }); return; }
      const address = server.address();
      if (!address || typeof address === 'string' || req.headers.host !== `127.0.0.1:${address.port}` || req.headers.origin || req.headers.authorization !== `Bearer ${token}`) { answer(403, { error: 'Forbidden graph request' }); return; }
      if (req.url !== '/local/editor' || req.method !== 'POST' || req.headers['content-type'] !== 'application/json') { answer(405, { error: 'JSON POST required' }); return; }
      void (async () => {
        try {
          let size = 0; const chunks: Buffer[] = [];
          for await (const chunk of req) { const buffer = Buffer.from(chunk as Uint8Array); size += buffer.length; if (size > 1_000_000) { answer(413, { error: 'Request too large' }); return; } chunks.push(buffer); }
          const payload: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8'));
          if (payload !== null) editorRequestSchema.parse(payload);
          answer(200, editorReplySchema.parse(await call(payload)));
        } catch (error) { answer(400, { error: error instanceof Error ? error.message : 'Graph request failed' }); }
      })();
    });
    await new Promise<void>((done, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', done); });
    if (options.keepAlive === false) server.unref();
    const address = server.address(); if (!address || typeof address === 'string') throw new Error('Missing graph host address');
    const endpoint = `http://127.0.0.1:${address.port}/local/editor`;
    lockContent = JSON.stringify({ pid: process.pid, token, endpoint }); writeFileSync(lock, lockContent, { mode: 0o600 });
    return { path, endpoint, owned: true, request: remote(endpoint, token), close };
  } catch (error) { await close(); throw error; }
}
