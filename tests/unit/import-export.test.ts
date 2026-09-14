import { expect, it } from "vitest";
import { createImportExport } from "../../packages/import-export/src/index.js";

it("round-trips semantic references and rejects bounded input", () => {
  const io = createImportExport({ maxChars: 100, maxDepth: 2 });
  const imported = io.importMarkdown("- Discuss [[Architecture]]\n  - ![logo](assets/logo.png)");
  expect(io.importMarkdown(io.exportMarkdown(imported))).toEqual(imported);
  expect(() => io.importMarkdown("      - too deep")).toThrow("IMPORT_LIMIT");
});
