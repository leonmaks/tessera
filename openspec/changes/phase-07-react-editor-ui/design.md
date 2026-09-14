## Context

See `proposal.md`. No application source exists yet; graph-client already exports frozen revision-aware snapshots, and graph-worker exposes typed command/query and local port adapters.

## Goals / Non-Goals

**Goals:**

- Create a React editor shell whose only graph interaction is a command/query client.
- Keep selection, collapse and drag preview ephemeral and outside the graph authority.
- Cover key interactions with Playwright and an in-memory worker bridge.

**Non-Goals:**

- Rich-text formatting, plugin UI slots, persistence migrations, or direct database APIs in the application.

## Decisions

- The app uses an injected semantic editor gateway rather than importing graph-db. It submits domain commands and receives immutable snapshots; direct database access is rejected by boundary checks.
- The editor reducer owns only ephemeral interaction state. Structural outcomes always come from worker-render deltas.
- Keyboard and pointer gestures are normalized to named intents before gateway invocation, enabling equivalent browser and desktop clients.

## Risks / Trade-offs

- [Initial UI does not cover every Logseq gesture] → preserve an explicit tested subset and extend through parity fixtures.
- [Worker responses can lag UI gestures] → retain focus intent locally and rely on authoritative reload after stale deltas.

## Migration Plan

No stored data or public remote protocol changes. The browser package can be removed independently if rollback is needed.
