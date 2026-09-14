## Context

`@logseq-ts/parser` exposes AST type declarations only and `@logseq-ts/references` is empty. Phase 02 already persists immutable block content, but parser/reference services must remain pure domain services: they consume text and UUID-labelled source blocks, and do not mutate SQLite or outliner state.

## Goals / Non-Goals

**Goals:**

- Build a small scanner and block stack for Markdown/Org instead of regex-only extraction.
- Preserve literal code regions as opaque nodes before scanning ordinary inline syntax.
- Provide frozen, deterministic AST/reference/backlink projections and a page-name index for aliases/namespaces.

**Non-Goals:**

- Markdown export/import, rich editor selections, graph persistence of derived refs, property parsing, and arbitrary plugin macros remain later phases.
- A full CommonMark or Org implementation is not required; only the compatibility syntax explicitly represented by parser contracts is in scope.

## Decisions

### Structural scanner followed by inline scanner

The document parser scans lines into block indentation/depth records and attaches them through a stack. Each block's text is then scanned left-to-right, recognizing delimiters with explicit precedence: fenced/spanned code first, then page/block refs, embeds, tags, links, macros and timestamps. This keeps code opaque and avoids a broad regex accidentally materializing nested syntax. A general Markdown dependency was not chosen because it would require extension-specific postprocessing and would hide Logseq delimiter semantics.

### References are derived immutable values

`@logseq-ts/references` takes parsed inline nodes and caller-provided UUID source records; it builds pure extraction, page-index and backlink snapshots. No parser or reference API obtains a graph write port. A later graph-worker derivation can persist these projections in the same logical transaction as a text update.

### Canonical page names are presentation-independent

The page index case-folds titles for lookup while retaining the original display title. `/` separates namespace segments; aliases map the same canonical lookup key to the target page. Ambiguous aliases are rejected rather than silently choosing a page.

## Risks / Trade-offs

- [Syntax edge cases differ from upstream] → retain golden and parity fixtures and only claim test-double evidence until a pinned executable oracle exists.
- [Large malformed input causes pathological scanning] → use linear cursor advancement and bounded delimiter searches; property tests cover arbitrary Unicode input without parser throws.
- [Alias collisions] → reject construction deterministically, leaving callers able to surface a validation error.

## Migration Plan

No persistence migration is needed. These APIs are pure; rollback removes their consumers without transforming stored graph facts.
