## Why

Tessera currently displays a smoke-test screen whose actions never persist graph edits. Users need a usable local outliner with durable pages, text editing and structural operations.

## What Changes

- Connect the React editor through a validated graph client to a serialized Node graph worker backed by filesystem SQLite.
- Add page creation/rename/navigation, block editing, Enter split, boundary merge, Tab/Shift+Tab, subtree collapse, selection, move, delete and session undo/redo.
- Add save/error feedback, page search, Markdown download and browser reload recovery.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `editor-ui`: durable local editing and navigation through an authoritative worker.

## Impact

Touches graph-client, graph-worker, outliner, local Vite hosting and web UI. L1/L5 behavior is affected. Reuses the pinned baseline be800f171172c259d4dd942346e4d247a0783738; existing structural fixtures and real browser regressions are required. Executable upstream parity remains unavailable and will not be claimed. No schema migration. Default graph lives at .tessera/graph.sqlite; rollback keeps that file. This local-hosted profile uses the desktop Node/SQLite architecture, not a claim that the standalone browser SQLite/WASM profile is implemented.

The user explicitly selected local interface collapse state. Preserve the current contract as the accepted L5 deviation `TESSERA-LOCAL-COLLAPSE` from upstream graph-persisted collapse; see `design.md`. No graph mutation or implementation change is needed. This resolves the product decision, not the remaining differential qualification gates.
