import fc from "fast-check";
import { expect, it } from "vitest";
import { createParser } from "../../packages/parser/src/index.js";
import { extractReferences } from "../../packages/references/src/index.js";

it("never materializes a page reference solely from a code span", () => {
  const parser = createParser();
  fc.assert(fc.property(fc.string(), value => {
    const document = parser.parseMarkdown(`- \`${value.replaceAll("`", "")}\``);
    expect(extractReferences(document.blocks[0]!.inline).pages).toEqual([]);
    expect(Object.isFrozen(document)).toBe(true);
  }), { numRuns: 100 });
});
