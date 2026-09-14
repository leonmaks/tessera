import fc from "fast-check";
import { expect, it } from "vitest";
import { createImportExport } from "../../packages/import-export/src/index.js";
it("canonical export/import preserves supported page-reference text", () => { const io = createImportExport(); fc.assert(fc.property(fc.stringMatching(/^[A-Za-z]{1,20}$/), title => { const doc = io.importMarkdown(`- [[${title}]]`); expect(io.importMarkdown(io.exportMarkdown(doc))).toEqual(doc); }), { numRuns: 50 }); });
