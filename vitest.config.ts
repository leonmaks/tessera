import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@tessera-ts/domain": fileURLToPath(new URL("./packages/domain/src/index.ts", import.meta.url)),
      "@tessera-ts/platform": fileURLToPath(new URL("./packages/platform/src/index.ts", import.meta.url))
    }
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts", "packages/**/*.test.ts"],
    exclude: ["tests/e2e/**", "**/node_modules/**", "**/dist/**"],
    coverage: {
      reporter: ["text", "html", "lcov"]
    }
  }
});
