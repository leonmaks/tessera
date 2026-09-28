import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Plugin, ViteDevServer, PreviewServer } from 'vite';
import { register } from 'tsx/esm/api';

/** Vite is only a same-origin adapter over the shared local graph host. */
export function editorHost(): Plugin {
  async function install(server: ViteDevServer | PreviewServer) {
    register();
    const { startEditorHost } = await import('@tessera-ts/desktop-cli-runtime/editor-host');
    const path = resolve(fileURLToPath(new URL('../', import.meta.url)), process.env.TESSERA_GRAPH_PATH || '.tessera/graph.sqlite');
    const host = await startEditorHost({ path, keepAlive: false });
    server.httpServer?.once('close', () => { void host.close(); });
    server.middlewares.use((req, res, next) => {
      if (req.url?.split('?')[0] !== '/local/editor') return next();
      const answer = (status: number, value: unknown) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(value)); };
      const authority = req.headers.host || '';
      if (!/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(authority) || (req.headers.origin && req.headers.origin !== `http://${authority}`)) { answer(403, { error: 'Forbidden origin' }); return; }
      if (req.method !== 'POST' || req.headers['content-type'] !== 'application/json') { answer(405, { error: 'JSON POST required' }); return; }
      void (async () => {
        try {
          let size = 0; const chunks: Buffer[] = [];
          for await (const chunk of req) { const buffer = Buffer.from(chunk as Uint8Array); size += buffer.length; if (size > 1_000_000) { answer(413, { error: 'Request too large' }); return; } chunks.push(buffer); }
          answer(200, await host.request(JSON.parse(Buffer.concat(chunks).toString('utf8'))));
        } catch (error) { answer(400, { error: error instanceof Error ? error.message : 'Save failed' }); }
      })();
    });
  }
  return { name: 'tessera-local-editor', configureServer: install, configurePreviewServer: install };
}
