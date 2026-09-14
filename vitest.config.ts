import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@logseq-ts/domain": fileURLToPath(new URL("./packages/domain/src/index.ts", import.meta.url)),
      "@logseq-ts/platform": fileURLToPath(new URL("./packages/platform/src/index.ts", import.meta.url))
    }
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts", "packages/**/*.test.ts"],
    exclude: ["tests/e2e/**"],
    coverage: {
      reporter: ["text", "html", "lcov"]
    }
  }
});
