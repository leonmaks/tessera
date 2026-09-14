import { describe, expect, it } from "vitest";
import { createParser } from "../../packages/parser/src/index.js";
import { createBacklinkIndex, createPageIndex, extractReferences } from "../../packages/references/src/index.js";

const parser = createParser();

describe("AST-derived references", () => {
  it("extracts semantic targets but never code literals", () => {
    const inline = parser.parseMarkdown("- [[Architecture]] #design ((00000000-0000-4000-8000-000000000302)) `[[literal]]`").blocks[0]!.inline;
    expect(extractReferences(inline)).toEqual({ pages: ["Architecture"], tags: ["design"], blocks: ["00000000-0000-4000-8000-000000000302"], links: [], embeds: [] });
  });

  it("resolves aliases and returns canonical immutable backlinks", () => {
    const pages = createPageIndex([{ title: "Project/Architecture", aliases: ["System Design"] }]);
    expect(pages.resolve("system design")).toEqual({ title: "Project/Architecture", key: "project/architecture", namespaces: ["Project", "Architecture"] });
    const backlinks = createBacklinkIndex([
      { uuid: "00000000-0000-4000-8000-000000000304", inline: parser.parseMarkdown("- [[Architecture]]").blocks[0]!.inline },
      { uuid: "00000000-0000-4000-8000-000000000303", inline: parser.parseMarkdown("- [[Architecture]] `[[Architecture]]`").blocks[0]!.inline }
    ]);
    expect(backlinks.page("Architecture")).toEqual(["00000000-0000-4000-8000-000000000303", "00000000-0000-4000-8000-000000000304"]);
    expect(Object.isFrozen(backlinks.page("Architecture"))).toBe(true);
  });
});
