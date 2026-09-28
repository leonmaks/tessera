## Context

The current UI only prints intents. Existing outliner commands and SQLite storage can be reused, but require a real serialized worker and validated transport.

## Goals / Non-Goals

**Goals:** working local notes, actual persistence, page navigation, keyboard/tree controls and visible save status.

**Non-Goals:** completion of all previously archived phases, remote collaboration, Electron packaging, browser-only SQLite/WASM, or upstream compatibility claims.

## Decisions

- Local Vite hosting forwards same-origin JSON RPC into one Node worker. Only the worker opens SQLite and calls outliner semantic operations. Apps depend on graph-client, which depends on domain protocol schemas.
- Every request is validated. The worker serializes reads/mutations, rejects stale revision and uses the client operation UUID for the one graph transaction. The response carries an immutable full snapshot; polling reads detect other tabs without a second mutation publication channel.
- Textarea drafts are renderer view state. A short debounce saves text; structural actions flush pending text before execution. Caret positions come from selectionStart/selectionEnd. IME composition is not intercepted.
- An exclusive local host lock fails safely if another host owns the graph. SQLite is stored outside build output; undo/redo is session scoped.
- Use existing split/merge semantics and plain-text editing; no invented rich-text parser behavior.

## Risks / Trade-offs

- [Concurrent tabs] → optimistic revision rejection, preserved draft and explicit retry.
- [Network failure] → show unsaved status and retain local draft; do not silently retry uncertain structural operations.
- [Full snapshots cost more than patches] → acceptable for this small local editor; requests are capped at 1 MB, snapshots are not yet paginated. No speculative patch merging. Large-graph performance remains a limitation.

## Migration Plan

No DB schema migration. Add .tessera/graph.sqlite on first startup. Keep data when reverting application code. Store test graphs under .tmp separately from user graph.

## Accepted compatibility deviation — TESSERA-LOCAL-COLLAPSE

The existing Tessera `editor-ui` specification requires collapse to be renderer-local and not mutate the graph. The pinned upstream `deps/outliner/test/logseq/outliner/op_test.cljs` contains `collapse-expand-blocks-op`, which asserts persisted `:block/collapsed?` after semantic operations; the upstream operation dispatches a transaction. This is now executable evidence: the complete upstream outliner suite passed 105 tests / 380 assertions; a separate focused run of `collapse-expand-blocks-op` passed 1 test / 2 assertions.

Product decision (2026-09-15): the user explicitly selected local interface state. Tessera keeps collapse/expand in the renderer, optionally persisted in browser-local storage, and never writes it to the authoritative graph. Collapse does not advance graph revision or create a graph undo entry. It is not synchronized through graph transactions.

Named deviation: `TESSERA-LOCAL-COLLAPSE`, scope L5 collapse/expand persistence. Rationale: explicit product preference for local view state over DB-Logseq's graph-persisted state. The existing implementation and no-graph-mutation regression remain valid; no code change is required. Differential evidence must report this difference explicitly, not hide it through normalization or claim exact upstream parity for this behavior.

The collapse decision is resolved and supersedes the pending-decision wording in earlier verification notes. Executable candidate/reference qualification for the remaining behaviors is still open; this decision alone does not close all phase exit gates.
