## Context

The SQLite graph database is the only durable mutable graph state after Phase 01. `@logseq-ts/outliner` currently exposes only an interface, while public graph reads can pull one UUID but cannot enumerate a structure. See `proposal.md` for motivation and the main outliner specification for the user-visible contract.

## Goals / Non-Goals

**Goals:**

- Provide semantic page/block operations over relational parent, page, and opaque ordering facts.
- Make each command one graph transaction with a single operation ID and immutable read snapshots.
- Preserve subtree UUIDs and update every descendant's page membership on a cross-page move.

**Non-Goals:**

- Rendering/editor event handling, worker RPC transport, parsing references, typed user properties, and legacy file-graph import are deferred to their roadmap phases.
- This phase does not claim executable L1 upstream parity when an upstream graph adapter is unavailable.

## Decisions

### Outliner is a semantic service over a narrow graph port

`@logseq-ts/outliner` receives a port with `transact` and a read-only entity scan; it does not import SQLite or manufacture datoms outside the transaction input. The concrete database remains the authority. This keeps the dependency direction ready for a graph-worker adapter in Phase 06, instead of allowing UI state to become a parallel tree.

### Structural state uses cardinality-one facts

Live page/block kind, content, parent, page, order, and deleted marker are graph facts. A `fact.replace` assertion retracts every current value of exactly one entity/attribute and adds the replacement inside its existing transaction. This is chosen over read/retract/write sequences so an observer never sees an incomplete move. The alternative, a mutable nested JSON document, would violate relational membership and the graph authority boundary.

### Command snapshots determine affected roots before one commit

The service reads a frozen snapshot, validates all anchors/cycles, derives a canonical selection (dropping descendants of a selected ancestor), then emits one fact transaction. It reindexes affected sibling sets into internal opaque tokens within that transaction. A stable fixed-width token is deliberately only produced by the service; callers receive and preserve it but cannot calculate positions.

Mutation sequence: snapshot -> validate -> build replacement assertions (including descendants' page values) -> database atomic commit with one generated operation ID -> publish the database report -> retain an inverse semantic state for undo/redo. Retry of the same operation ID remains the Phase 01 database replay contract.

### Deletion is a live-membership tombstone

Delete marks each subtree node deleted, and child projections exclude tombstoned nodes. This retains UUID facts and command history while ensuring deleted nodes cannot become anchors. The alternative hard delete makes undo and durable audit semantics unnecessarily destructive.

### Parity scenarios have first-class structural commands

The compatibility scenario schema gains `moveBlocks`, `indentBlocks`, `outdentBlocks`, `splitBlock`, and `mergeWithPrevious` command forms. Candidate adapters execute the same validated fixture and project the result through the existing canonical snapshot contract. This is chosen over fixture-specific test code so unknown commands remain a runtime validation error.

## Risks / Trade-offs

- [An out-of-process writer can change the graph between snapshot and commit] → Phase 02 commands are serialized by one service instance; Phase 06 will add expected-revision validation at the worker boundary. Current database transaction atomicity still prevents partial writes.
- [Full sibling reindexing changes more order facts than a fractional token] → it is bounded to affected parents and one atomic report; opaque order tokens make the strategy replaceable later.
- [Pinned upstream execution unavailable] → record evidence limitation and run fixture candidate plus declared test double with `compatible: false`.

## Migration Plan

No SQL table migration is needed. Existing facts remain valid; `fact.replace` is an additive transaction command and current schema already stores retractions. Rollback consists of reverting the application code; no durable data conversion occurs.
