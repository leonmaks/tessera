## Context

Search is currently empty and graph projection has no package. Both are rebuildable consumers of semantic graph data, not authorities.

## Goals / Non-Goals

**Goals:** deterministic incremental keyword index, optional semantic boundary, and capped graph neighborhoods.

**Non-Goals:** database writes, embeddings, or unbounded visualization.

## Decisions

- Index immutable document records supplied after commit; rebuild replaces the index atomically.
- Score keywords by token occurrence and break ties by UUID.
- Traverse sorted adjacency lists under hard node/edge caps.

## Risks / Trade-offs

- [In-memory index is not durable] → it is intentionally rebuildable from authoritative state.

## Migration Plan

No persistence changes occur.
