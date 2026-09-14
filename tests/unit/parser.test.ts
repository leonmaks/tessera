import { describe, expect, it } from "vitest";
import { createParser } from "../../packages/parser/src/index.js";

describe("semantic Markdown and Org parser", () => {
  it("builds frozen nested Markdown blocks and typed inline syntax", () => {
    const document = createParser().parseMarkdown("- Discuss [[Architecture]] #design ((00000000-0000-4000-8000-000000000301))\n  - `[[literal]]`\n- [label](https://example.test) {{renderer :clock}}");
    expect(document.blocks).toHaveLength(2);
    expect(document.blocks[0]).toMatchObject({ raw: "Discuss [[Architecture]] #design ((00000000-0000-4000-8000-000000000301))", children: [{ raw: "`[[literal]]`", inline: [{ kind: "code", value: "[[literal]]" }] }] });
    expect(document.blocks[0]!.inline).toEqual(expect.arrayContaining([{ kind: "page-ref", title: "Architecture" }, { kind: "tag", title: "design" }, { kind: "block-ref", uuid: "00000000-0000-4000-8000-000000000301" }]));
    expect(document.blocks[1]!.inline).toEqual(expect.arrayContaining([{ kind: "link", label: "label", url: "https://example.test" }, { kind: "macro", name: "renderer", args: [":clock"] }]));
    expect(Object.isFrozen(document)).toBe(true);
  });

  it("builds equivalent Org nesting and preserves fenced code as opaque", () => {
    const document = createParser().parseOrg("* A\n** B\n#+begin_src text\n[[Not a page]]\n#+end_src");
    expect(document.blocks[0]).toMatchObject({ raw: "A", children: [{ raw: "B", children: [{ inline: [{ kind: "code", value: "[[Not a page]]" }] }] }] });
  });
});
