## Why

Phase 00 established a deterministic harness, but no component owns durable graph facts. Phase 01 supplies the transactional graph foundation that every later graph command and read operation requires.

## What Changes

- Implement a graph-worker-owned EAV persistence engine with SQLite migrations.
- Expose UUID-based entity creation, transaction reports, revision-aware reads and supported pull projections.
- Make transaction atomicity, idempotency, recovery and post-commit listener isolation executable contracts.
- Record database-first upstream evidence and deterministic parity fixtures for the foundation.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `graph-data-model`: Define durable typed EAV assertions, UUID allocation and deterministic public projections.
- `transaction-engine`: Define validated atomic transaction input, commit reports, idempotent operation handling and read semantics.
- `runtime-persistence`: Define schema migration and recovery behavior for the authoritative SQLite graph store.

## Impact

Impacts compatibility level L0 and `packages/domain`, `packages/graph-db`, and `packages/graph-worker`; callers continue using semantic commands and do not receive raw datom mutation APIs. Upstream evidence will use the pinned SHA `be800f171172c259d4dd942346e4d247a0783738`, source-verified architecture material, and independently authored fixture snapshots. The migration is additive from the scaffold: migration records run atomically and a failed migration leaves the previous schema and data usable; no destructive migration is introduced. The target is DB-first graph behavior. Legacy file-graph import/export remains out of scope for Phase 08.
