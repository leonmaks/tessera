import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";

export default defineConfig({
  resolve: {
    alias: {
      "@logseq-ts/editor-ui": fileURLToPath(new URL("./packages/editor-ui/src/index.ts", import.meta.url))
    }
  },
  server: { fs: { allow: [fileURLToPath(new URL(".", import.meta.url))] } }
});
