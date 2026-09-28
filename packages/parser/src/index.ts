export interface DocumentAst { readonly blocks: readonly BlockAst[]; }
export interface BlockAst { readonly raw: string; readonly inline: readonly InlineNode[]; readonly properties: readonly ParsedProperty[]; readonly children: readonly BlockAst[]; }
export interface ParsedProperty { readonly key: string; readonly rawValue: string; }
export type InlineNode = { readonly kind: "text"; readonly value: string } | { readonly kind: "page-ref"; readonly title: string } | { readonly kind: "block-ref"; readonly uuid: string } | { readonly kind: "tag"; readonly title: string } | { readonly kind: "link"; readonly label: string; readonly url: string } | { readonly kind: "code"; readonly value: string } | { readonly kind: "macro"; readonly name: string; readonly args: readonly string[] } | { readonly kind: "embed"; readonly target: string } | { readonly kind: "timestamp"; readonly raw: string };
export interface Parser { parseMarkdown(source: string): DocumentAst; parseOrg(source: string): DocumentAst; }
export interface ParserOptions { readonly maxSourceLength?: number; }
interface Mutable { readonly raw: string; readonly inline: readonly InlineNode[]; readonly properties: readonly ParsedProperty[]; readonly children: Mutable[]; }
class SemanticParser implements Parser {
  constructor(private readonly maxSourceLength: number) {}
  parseMarkdown(source: string): DocumentAst { return parseDocument(source, "markdown", this.maxSourceLength); }
  parseOrg(source: string): DocumentAst { return parseDocument(source, "org", this.maxSourceLength); }
}
function parseDocument(source: string, format: "markdown" | "org", maxSourceLength: number): DocumentAst {
  if (source.length > maxSourceLength) throw new Error("PARSER_LIMIT source length");
  const roots: Mutable[] = [], stack: { readonly depth: number; readonly block: Mutable }[] = [], lines = source.replace(/\r\n?/g, "\n").split("\n");
  for (let index = 0; index < lines.length; index++) { const line = lines[index]!;
    if (/^```/.test(line) || /^#\+begin_src\b/i.test(line)) { const close = format === "org" ? /^#\+end_src\b/i : /^```/, body: string[] = []; while (++index < lines.length && !close.test(lines[index]!)) body.push(lines[index]!); append(roots, stack, stack.length ? stack.at(-1)!.depth + 1 : 0, makeBlock(body.join("\n"), [{ kind: "code", value: body.join("\n") }])); continue; }
    const match = format === "markdown" ? /^(\s*)[-*+]\s+(.*)$/.exec(line) : /^(\*+)\s+(.*)$/.exec(line);
    if (match) append(roots, stack, format === "markdown" ? Math.floor(match[1]!.length / 2) : match[1]!.length - 1, makeBlock(match[2]!, parseInline(match[2]!)));
    else if (line.trim()) append(roots, stack, 0, makeBlock(line.trim(), parseInline(line.trim())));
  } return freeze({ blocks: roots.map(freezeBlock) });
}
function append(roots: Mutable[], stack: { readonly depth: number; readonly block: Mutable }[], depth: number, node: Mutable): void { while (stack.length && stack.at(-1)!.depth >= depth) stack.pop(); const parent = stack.at(-1)?.block; (parent ? parent.children : roots).push(node); stack.push({ depth, block: node }); }
function makeBlock(raw: string, inline: readonly InlineNode[]): Mutable { const property = /^([^:\s][^:]*)::\s*(.*)$/.exec(raw); return { raw, inline, properties: property ? [{ key: property[1]!.trim(), rawValue: property[2]! }] : [], children: [] }; }
export function parseInline(source: string): readonly InlineNode[] { const nodes: InlineNode[] = []; let cursor = 0, text = ""; const push = () => { if (text) { nodes.push({ kind: "text", value: text }); text = ""; } }; while (cursor < source.length) {
  if (source[cursor] === "`") { const end = source.indexOf("`", cursor + 1); if (end >= 0) { push(); nodes.push({ kind: "code", value: source.slice(cursor + 1, end) }); cursor = end + 1; continue; } }
  const page = enclosed(source, cursor, "[[", "]]"), ref = enclosed(source, cursor, "((", "))"), macro = enclosed(source, cursor, "{{", "}}");
  if (page) { push(); nodes.push({ kind: "page-ref", title: page.value }); cursor = page.end; continue; } if (ref) { push(); nodes.push({ kind: "block-ref", uuid: ref.value }); cursor = ref.end; continue; } if (macro) { push(); const [name, ...args] = macro.value.trim().split(/\s+/); nodes.push(name === "embed" && args[0] ? { kind: "embed", target: args[0] } : { kind: "macro", name: name ?? "", args }); cursor = macro.end; continue; }
  if (source[cursor] === "[") { const close = source.indexOf("](", cursor + 1), end = close < 0 ? -1 : source.indexOf(")", close + 2); if (end >= 0) { push(); nodes.push({ kind: "link", label: source.slice(cursor + 1, close), url: source.slice(close + 2, end) }); cursor = end + 1; continue; } }
  if (source[cursor] === "#" && (cursor === 0 || /\s/.test(source[cursor - 1]!))) { const tag = /^#([^\s#()[\]`]+)/.exec(source.slice(cursor)); if (tag) { push(); nodes.push({ kind: "tag", title: tag[1]! }); cursor += tag[0].length; continue; } }
  if (source[cursor] === "<") { const end = source.indexOf(">", cursor + 1); if (end >= 0) { push(); nodes.push({ kind: "timestamp", raw: source.slice(cursor, end + 1) }); cursor = end + 1; continue; } } text += source[cursor++]!;
} push(); return freeze(nodes); }
function enclosed(source: string, start: number, open: string, close: string): { readonly value: string; readonly end: number } | undefined { if (!source.startsWith(open, start)) return undefined; const end = source.indexOf(close, start + open.length); return end < 0 ? undefined : { value: source.slice(start + open.length, end), end: end + close.length }; }
function freezeBlock(node: Mutable): BlockAst { return freeze({ raw: node.raw, inline: node.inline, properties: node.properties, children: node.children.map(freezeBlock) }); }
function freeze<T>(value: T): T { if (value && typeof value === "object" && !Object.isFrozen(value)) { for (const child of Object.values(value as Record<string, unknown>)) freeze(child); Object.freeze(value); } return value; }
export function createParser(options: ParserOptions = {}): Parser {
  const maxSourceLength = options.maxSourceLength ?? 1_000_000;
  if (!Number.isSafeInteger(maxSourceLength) || maxSourceLength < 1) throw new Error("Invalid parser maxSourceLength");
  return new SemanticParser(maxSourceLength);
}
