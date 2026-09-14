import { createParser, type BlockAst, type InlineNode } from "@logseq-ts/parser";

export interface PortableBlock { readonly text: string; readonly inline: readonly InlineNode[]; readonly children: readonly PortableBlock[]; }
export interface PortableDocument { readonly format: "markdown" | "org"; readonly blocks: readonly PortableBlock[]; readonly assets: readonly string[]; }
export interface ImportExport { importMarkdown(source: string): PortableDocument; importOrg(source: string): PortableDocument; exportMarkdown(document: PortableDocument): string; }
export function createImportExport(limits: { readonly maxChars?: number; readonly maxDepth?: number } = {}): ImportExport {
  const maxChars = limits.maxChars ?? 1_000_000, maxDepth = limits.maxDepth ?? 256, parser = createParser();
  const convert = (source: string, format: "markdown" | "org"): PortableDocument => {
    if (source.length > maxChars) throw new Error("IMPORT_LIMIT chars");
    for (const line of source.replace(/\r\n?/g, "\n").split("\n")) {
      const depth = format === "markdown" ? Math.floor((/^(\s*)/.exec(line)?.[1]?.length ?? 0) / 2) : Math.max(0, (/^(\*+)/.exec(line)?.[1]?.length ?? 1) - 1);
      if (depth > maxDepth) throw new Error("IMPORT_LIMIT depth");
    }
    const parsed = format === "markdown" ? parser.parseMarkdown(source) : parser.parseOrg(source);
    const assets = new Set<string>();
    const block = (input: BlockAst, depth: number): PortableBlock => { if (depth > maxDepth) throw new Error("IMPORT_LIMIT depth"); for (const node of input.inline) if (node.kind === "link" && /^assets\//.test(node.url)) assets.add(node.url); return freeze({ text: input.raw, inline: input.inline, children: input.children.map(child => block(child, depth + 1)) }); };
    return freeze({ format, blocks: parsed.blocks.map(value => block(value, 0)), assets: [...assets].sort() });
  };
  return { importMarkdown: source => convert(source, "markdown"), importOrg: source => convert(source, "org"), exportMarkdown(document) { const lines: string[] = []; const emit = (block: PortableBlock, depth: number) => { lines.push(`${"  ".repeat(depth)}- ${block.text}`); for (const child of block.children) emit(child, depth + 1); }; for (const block of document.blocks) emit(block, 0); return lines.join("\n"); } };
}
function freeze<T>(value: T): T { if (value && typeof value === "object" && !Object.isFrozen(value)) { for (const child of Object.values(value as Record<string, unknown>)) freeze(child); Object.freeze(value); } return value; }
