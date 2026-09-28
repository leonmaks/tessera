import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import { editorHost } from './scripts/editor-host';

export default defineConfig({
  plugins: [editorHost()],
  resolve: {
    alias: {
      "@tessera-ts/editor-ui": fileURLToPath(new URL("./packages/editor-ui/src/index.ts", import.meta.url))
      ,"@tessera-ts/graph-client": fileURLToPath(new URL('./packages/graph-client/src/index.ts', import.meta.url))
      ,"@tessera-ts/domain": fileURLToPath(new URL('./packages/domain/src/index.ts', import.meta.url))
      ,"@tessera-ts/graph-db/browser-opfs": fileURLToPath(new URL('./packages/graph-db/src/browser-opfs.ts', import.meta.url))
      ,"@tessera-ts/graph-worker/portable-page-runtime": fileURLToPath(new URL('./packages/graph-worker/src/portable-page-runtime.ts', import.meta.url))
    }
  },
  optimizeDeps: { exclude: ["@sqlite.org/sqlite-wasm"] },
  server: { fs: { allow: [fileURLToPath(new URL(".", import.meta.url))] } }
});
