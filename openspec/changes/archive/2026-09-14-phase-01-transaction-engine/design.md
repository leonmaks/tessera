## Context

The current domain types and graph-db schema are scaffolds. The target architecture assigns the graph worker the sole mutable authority while SQLite stores authoritative entities, attributes, facts and transactions. See proposal.md and the three delta specs for behavioral scope.

## Goals / Non-Goals

**Goals:** create a DB-first in-process engine usable behind the worker boundary; retain UUID as the public identity; make commit, recovery and read determinism testable.

**Non-Goals:** block hierarchy commands, parsing, reference derivation, Datalog, renderer deltas, remote sync and legacy file graph import/export. These belong to later phases.

## Decisions

- Use domain-owned validated transaction request/value types. graph-db accepts only these typed mutations and owns all raw SQL; graph-worker will later translate semantic commands into them. This preserves `apps -> graph-client -> domain -> graph-worker -> graph-db` direction.
- Store durable facts in EAV form with numeric SQLite keys internal to graph-db and UUIDs at every public boundary. Store canonical value encodings so transaction reports and pulls can be deterministic.
- Execute validation, operation-id replay check, fact application, transaction journal write and revision increment in one SQLite transaction. The operation fingerprint is stored with its completed report to provide idempotent retries and reject conflicting reuses.
- Run post-commit listeners only after durable commit. Catch each listener error, record a retryable diagnostic and continue notifying other listeners; reports never include listener-generated writes.
- Pull is a read-only UUID API with a small explicit pattern grammar in Phase 01. It returns frozen, canonically ordered data and a typed absence outcome. Datalog compilation is deferred to Phase 05.
- Migrations have ordered immutable identifiers in graph metadata. Each migration is atomic; a failed migration is rolled back and leaves the prior version usable. The migration runner does not silently repair or drop schema.

### Transaction sequence

`semantic command (future worker) -> validated transaction input -> operation replay lookup -> validate assertions -> BEGIN IMMEDIATE -> apply EAV facts + transaction journal + revision -> COMMIT -> immutable report -> isolated listeners`.

Expected-revision conflict handling is deferred to the worker/RPC revision contract in Phase 06. Within Phase 01, operation replay is the retry path: exact replay returns its original report and a conflicting reuse fails.

## Risks / Trade-offs

- The Node adapter is `node:sqlite` `DatabaseSync`: it was added in Node 22.5 and no longer needs an experimental flag from Node 22.13, so it is available at this project's Node 22.20 floor. Browser SQLite remains a later platform adapter.
- Early pull grammar could be mistaken for Datalog → keep its accepted patterns narrow and validate them; Phase 05 owns query language compatibility.
- Crash timing is platform-dependent → use database transactions and reopen tests around commit boundaries.
- No local upstream checkout exists → record source request outcome and do not label fixtures as upstream parity until an executable adapter is available.

## Migration Plan

1. Create version-zero metadata and base tables for a new graph.
2. Apply each later migration in a single database transaction and only mark its version after success.
3. On failure, roll back the migration transaction, retain the prior schema/data and return a structured open failure.
4. No destructive migration is planned; rollback consists of reopening the preserved prior schema. A future destructive migration requires a backup and explicit rollback design before implementation.
