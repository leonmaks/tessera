## Why

Search and graph views need rebuildable projections rather than renderer-owned copies of graph state. This phase introduces bounded keyword indexing and graph projection APIs over committed semantic inputs.

## What Changes

- Add incremental keyword search with deterministic rebuild equivalence.
- Add bounded graph neighborhood projection.
- Keep semantic ranking behind an optional provider boundary.

## Capabilities

### New Capabilities

- `graph-projection`: Bounded graph-view projection from semantic edges.

### Modified Capabilities

- `search`: Add deterministic keyword ordering and explicit projection limits.

## Impact

Adds rebuildable in-memory packages only; graph writes remain worker commands. No migration is needed; parity is test-double-only against pinned SHA `be800f171172c259d4dd942346e4d247a0783738`.
