export interface DocumentAst {
  readonly blocks: readonly BlockAst[];
}

export interface BlockAst {
  readonly raw: string;
  readonly inline: readonly InlineNode[];
  readonly properties: readonly ParsedProperty[];
  readonly children: readonly BlockAst[];
}

export interface ParsedProperty {
  readonly key: string;
  readonly rawValue: string;
}

export type InlineNode =
  | { readonly kind: "text"; readonly value: string }
  | { readonly kind: "page-ref"; readonly title: string }
  | { readonly kind: "block-ref"; readonly uuid: string }
  | { readonly kind: "tag"; readonly title: string }
  | { readonly kind: "link"; readonly label: string; readonly url: string }
  | { readonly kind: "code"; readonly value: string }
  | { readonly kind: "macro"; readonly name: string; readonly args: readonly string[] }
  | { readonly kind: "embed"; readonly target: string }
  | { readonly kind: "timestamp"; readonly raw: string };

export interface Parser {
  parseMarkdown(source: string): DocumentAst;
  parseOrg(source: string): DocumentAst;
}
