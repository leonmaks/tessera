import "../../scripts/windows-user-info-shim.cjs";
import { resolve } from "node:path";
import { createServer } from "vite";

export default async function startE2eViteServer(): Promise<() => Promise<void>> {
  process.env.TESSERA_GRAPH_PATH = `.tmp/editor-e2e-${Date.now()}.sqlite`;
  const server = await createServer({
    root: resolve("apps/web"),
    configFile: resolve("vite.config.ts"),
    server: { host: "127.0.0.1", port: 4180, strictPort: true },
  });
  await server.listen();
  return async () => { await server.close(); };
}
