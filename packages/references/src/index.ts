import type { InlineNode } from "@logseq-ts/parser";

export interface ExtractedReferences { readonly pages: readonly string[]; readonly tags: readonly string[]; readonly blocks: readonly string[]; readonly links: readonly string[]; readonly embeds: readonly string[]; }
export interface PageDefinition { readonly title: string; readonly aliases?: readonly string[]; }
export interface PageIdentity { readonly title: string; readonly key: string; readonly namespaces: readonly string[]; }
export interface PageIndex { resolve(name: string): PageIdentity | undefined; }
export interface BacklinkSource { readonly uuid: string; readonly inline: readonly InlineNode[]; }
export interface BacklinkIndex { page(title: string): readonly string[]; block(uuid: string): readonly string[]; }
export function extractReferences(inline: readonly InlineNode[]): ExtractedReferences {
  const pages: string[] = [], tags: string[] = [], blocks: string[] = [], links: string[] = [], embeds: string[] = [];
  for (const node of inline) { if (node.kind === "page-ref") pages.push(node.title); else if (node.kind === "tag") tags.push(node.title); else if (node.kind === "block-ref") blocks.push(node.uuid); else if (node.kind === "link") links.push(node.url); else if (node.kind === "embed") embeds.push(node.target); }
  return freeze({ pages: unique(pages), tags: unique(tags), blocks: unique(blocks), links: unique(links), embeds: unique(embeds) });
}
export function createPageIndex(definitions: readonly PageDefinition[]): PageIndex { const values = new Map<string, PageIdentity>(); for (const definition of definitions) { const identity = freeze({ title: definition.title, key: key(definition.title), namespaces: definition.title.split("/").filter(Boolean) }); for (const name of [definition.title, ...(definition.aliases ?? [])]) { const canonical = key(name); const prior = values.get(canonical); if (prior && prior.key !== identity.key) throw new Error(`Ambiguous page alias: ${name}`); values.set(canonical, identity); } } return freeze({ resolve(name: string): PageIdentity | undefined { return values.get(key(name)); } }); }
export function createBacklinkIndex(sources: readonly BacklinkSource[]): BacklinkIndex { const pages = new Map<string, string[]>(), blocks = new Map<string, string[]>(); for (const source of sources) { const refs = extractReferences(source.inline); for (const page of refs.pages) push(pages, key(page), source.uuid); for (const block of refs.blocks) push(blocks, block, source.uuid); } return freeze({ page(title: string): readonly string[] { return freeze([...(pages.get(key(title)) ?? [])].sort()); }, block(uuid: string): readonly string[] { return freeze([...(blocks.get(uuid) ?? [])].sort()); } }); }
function push(index: Map<string, string[]>, target: string, source: string): void { const values = index.get(target) ?? []; if (!values.includes(source)) values.push(source); index.set(target, values); }
function unique(values: readonly string[]): readonly string[] { return freeze([...new Set(values)].sort()); }
function key(value: string): string { return value.trim().toLocaleLowerCase("en-US"); }
function freeze<T>(value: T): T { if (value && typeof value === "object" && !Object.isFrozen(value)) { for (const child of Object.values(value as Record<string, unknown>)) freeze(child); Object.freeze(value); } return value; }
