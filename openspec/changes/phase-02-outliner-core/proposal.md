## Why

Phase 01 persists immutable UUID-addressed graph facts, but the public outliner surface is only a type stub.  The next phase must make block structure observable as atomic semantic operations without creating a second mutable tree in the renderer.

## What Changes

- Add the L1 outliner command service for pages and blocks: insert, edit, delete, subtree move, indent/outdent, split/merge, grouped undo and redo.
- Persist structural membership as typed graph facts (`parent`, `page`, and opaque order), with all descendants receiving the new page on a cross-page move in one transaction.
- Add a read-only graph enumeration port and a cardinality-one replacement assertion so semantic services can build snapshots without raw mutation access.
- Add executable BDD, Vitest, fast-check, and permanent structural-command parity fixtures.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `outliner`: define deletion, multi-block movement, and observable read snapshots required to complete the Phase 02 structural command contract.
- `compatibility-oracle`: accept structural outliner command fixtures beyond single-block insert/move/delete.

## Impact

Affected packages are `domain`, `graph-db`, and `outliner`; only the graph database receives fact transactions. This affects compatibility level L1. SQLite schema remains backward compatible: the replacement operation reuses the existing EAV tables, so no destructive migration is required and rollback is a code rollback. The structural parity corpus will initially run against a declared test double because no executable pinned upstream graph adapter is available; reports will not claim L1 compatibility.
