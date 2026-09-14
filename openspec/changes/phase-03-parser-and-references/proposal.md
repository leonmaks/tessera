## Why

Blocks currently retain only raw outliner content, so page/block links cannot be interpreted or indexed safely. Phase 03 adds a semantic, non-regex-only parser and derived reference surface before properties, queries, and UI begin to depend on textual syntax.

## What Changes

- Add independently implemented Markdown and Org block parsers with nested block structure and typed inline AST nodes.
- Recognize page refs, block refs, tags, links, code spans/fences, embeds, macros, and timestamps; never materialize reference-looking code as graph relationships.
- Add immutable reference extraction and backlink projection ports over parsed ASTs, including page aliases and namespace foundation.
- Add golden, BDD, property, and parity fixtures for parser and semantic-reference behavior.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `parser-references`: define Markdown/Org document boundaries, reference extraction, alias/namespace behavior, and immutable backlinks required by Phase 03.

## Impact

This affects compatibility level L2 and the `parser` and `references` domain packages only; it does not migrate or mutate SQLite graph state. Rollback is a code rollback. Upstream syntax docs and pinned source will be inspected; unless a runnable upstream parser adapter is obtained, parity fixtures will use an explicit test double and will not claim L2 compatibility.
