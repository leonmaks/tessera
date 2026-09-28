## Context

See proposal.md for scope. The repository has independently tested package-level beginnings for most roadmap areas, while the working editor is a narrow local Node-hosted profile and Electron provides only client-facing lifecycle/lock behavior. Main specifications define the target observable contracts, but many are not yet wired through the graph worker, durable SQLite model, browser runtime, UI and executable upstream differential harness.

## Goals / Non-Goals

**Goals:** Complete all roadmap deliverables and their documented exit criteria through the existing authority boundary, retaining the accepted `TESSERA-LOCAL-COLLAPSE` deviation explicitly in all parity reporting.

**Non-Goals:** Copying or transliterating upstream implementation, replacing user graphs, silently changing public contracts, treating fixture test doubles as upstream parity, or archiving a phase merely because it compiles.

## Decisions

### Delivery order and authority

Implement in roadmap dependency order, rather than wiring a new UI feature directly to storage:

1. qualify the baseline/harness and reconcile the two current delivery audits;
2. make parser/reference, property/class/task/journal and query services durable semantic worker capabilities;
3. complete browser worker/client/delta integration before extending renderer surfaces;
4. add import/export/assets, search/projection and plugin surfaces;
5. complete runtime/CLI/backup, then ordered sync, then the remote semantic API.

The dependency direction remains `apps -> graph-client -> domain services -> graph-worker -> graph-db/platform adapters`. Worker commands are the only mutation path for every first-party, plugin, CLI, sync and HTTP operation. React stores keep view state and immutable snapshots only; they do not cache mutable graph truth.

### Persistent semantics and migration

Extend the graph schema through contiguous, transactional migrations with a recorded version. Migration tests must exercise interruption and reopening; any destructive conversion requires explicit backup and rollback before code is written. Parser/reference derivation, index effects and plugin notifications happen from committed semantic operations, never from renderer text scraping or raw datom endpoints. Auxiliary search/client-op stores are rebuildable and excluded from authoritative backup.

### Transport and lifecycle

Define typed runtime-validated command/query envelopes for each new capability. Node, Electron and CLI use the existing isolated worker model; browser uses an adapter whose authoritative SQLite/OPFS/WASM handle remains outside the renderer. Renderer subscriptions apply one immutable revisioned delta per committed operation; stale child membership reloads from authority. Long-running import/query/search/sync work receives limits and deterministic failure rather than partial unacknowledged state.

Portable semantic command handlers are introduced one command family at a time. They depend only on narrow storage ports, while Node filesystem SQLite and browser SQLite/OPFS workers implement those ports. A browser worker never forwards a semantic mutation to the Node graph as a substitute for browser execution, and the renderer never receives a database handle. The initial portable slice is case-insensitive `page.create`; it is executed against both adapters as an observable revision/idempotency fixture before additional editor commands migrate.

### Compatibility evidence

For each capability, first capture upstream behavior at the pinned baseline with an independently authored scenario; normalize only permitted internal metadata. Execute the same fixture against upstream and candidate where executable. If upstream behavior, file-graph behavior and DB-graph behavior conflict, stop that subtask, document the divergence and obtain a product decision through an OpenSpec update. Continue to report `TESSERA-LOCAL-COLLAPSE` as a named L5 difference.

### Mutation and retry sequence

Semantic client/adapter intent -> runtime validation -> serialized worker command -> domain validation/derivation -> one SQLite commit/revision -> post-commit index/plugin/sync effects isolated from rollback -> revisioned snapshot/delta response. A stale client pulls/reloads/rebases only when the operation is demonstrably safe; unknown mutation outcomes remain visible to the caller. Presence bypasses the durable transaction sequence entirely.

## Risks / Trade-offs

- [Pinned upstream executable behavior conflicts with existing spec] -> stop the affected phase and update its OpenSpec decision rather than inventing compatibility.
- [Cross-cutting schema migration damages notes] -> versioned migration, SQLite-consistent backup, interruption/reopen tests and a retained rollback path.
- [Browser SQLite/WASM/OPFS differs from filesystem SQLite] -> prove identical semantic command fixtures through the platform adapter before enabling browser UI claims.
- [Large import, query, search or sync work exhausts resources] -> enforce explicit bounded inputs, rows, time, depth and batch sizes with deterministic errors.
- [Plugin, sync or HTTP adapter bypasses authority] -> boundary tests and runtime validation reject raw graph write paths.
- [Scope obscures incomplete qualification] -> keep evidence per roadmap phase and leave incomplete phase tasks unchecked.

## Migration Plan

Before each persistent capability migration, create and validate a SQLite-consistent backup plus restore fixture. Deploy additive schema versions one at a time; reopen verifies the prior committed version after any failed migration. Rollback restores the verified backup or leaves the prior database intact; it never copies, deletes or rewrites user graph files automatically. Browser auxiliary stores are rebuildable and are not migration authority.
