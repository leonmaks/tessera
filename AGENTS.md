# AGENTS.md — Codex Operating Contract

## Mission

Implement a TypeScript behavioral reimplementation of Logseq according to `openspec/specs`, with upstream Logseq used as a reference oracle.

## Mandatory workflow

For every implementation phase:

1. Read `docs/IMPLEMENTATION-ROADMAP.md`.
2. Read all relevant `openspec/specs/*/spec.md`.
3. Inspect `upstream/baseline.json`.
4. Use OpenSpec to create/update the change artifacts before implementation.
5. Convert each observable behavior into BDD scenarios before production code.
6. Add the smallest failing unit/property/contract test.
7. Implement only enough code to make the tests pass.
8. Run focused tests, then `pnpm verify`.
9. Run parity tests for all changed behavior.
10. Update architecture docs only when the implementation changes an explicit decision.
11. Sync/archive the OpenSpec change only after all exit criteria pass.

## Architecture guardrails — MUST NOT be violated

### Authority
- The graph worker owns the only mutable authoritative graph state.
- React/UI stores MUST NOT become a second graph authority.
- Desktop/CLI/plugin/sync/API mutations MUST use semantic domain commands.
- No UI, plugin, CLI, sync adapter, or HTTP handler may execute raw graph writes.

### Identity and transactions
- Public entity identity is UUID-based. SQLite integer ids are internal.
- A logical domain operation is atomic from the renderer/plugin observer perspective.
- Every committed graph transaction advances a monotonic revision.
- One user/domain operation has one `operationId`, even if it changes many datoms.
- Post-commit listeners may fail independently; they MUST NOT roll back an already committed graph transaction.

### Outliner
- Parent/order relationships define the block tree.
- Moves MUST preserve UUIDs and descendants.
- Moving a subtree between pages MUST update page membership consistently.
- Cycles are invalid and MUST be rejected.
- Ordering is an opaque sortable token; consumers do not manufacture order tokens directly.

### Renderer
- Renderer state is derived from immutable snapshots and revision-aware deltas.
- Never publish the same graph mutation independently through both command response and subscription.
- Stale children patches are reloaded, not speculatively merged.

### Properties/classes
- Properties are schema entities, not `Record<string,string>`.
- Values are typed.
- Tags/classes may carry properties and inheritance.
- Class inheritance is a DAG and cycles are rejected.

### Queries
- Datalog-compatible behavior is part of the public compatibility contract.
- Do not replace it with ad-hoc JS filtering or SQL-only public APIs.

### Sync
- Sync uses ordered transactions and stale-revision rejection/rebase semantics.
- Presence is ephemeral and is not a graph transaction.
- Raw remote datom mutation endpoints are forbidden.

### Parsing
- Markdown/Org parsing is semantic, not regex-driven.
- References inside code spans/fences must not be materialized as graph references.
- Import/export must have round-trip semantic tests.

## Testing rules

- BDD = observable behavior.
- Vitest = component and contract TDD.
- fast-check = structural invariants/fuzzing.
- Playwright = real editor/UI behavior.
- Differential tests = candidate vs pinned upstream normalized snapshots.
- Never weaken or delete a failing parity test just to make CI green.
- Every fixed bug adds a permanent regression fixture.

## TypeScript rules

- `strict: true` is mandatory.
- Avoid `any`; use `unknown` plus validation at boundaries.
- All RPC/network/plugin payloads require runtime validation.
- Domain packages do not import React, Electron, browser globals, or SQLite drivers.
- Platform effects enter through interfaces/adapters.

## Dependency direction

Allowed high-level direction:

`apps -> graph-client -> domain services -> graph-worker -> graph-db/platform adapters`

The following are forbidden:
- `apps/* -> graph-db`
- `plugin-sdk -> graph-db`
- `sync-protocol -> graph-db`
- `domain -> React/Electron/SQLite`
- cross-package imports from private `src/*` paths

## Upstream source usage

Allowed:
- inspect source/tests/docs to identify behavior, invariants, protocol shapes, and edge cases;
- record source mapping in `docs/source-map.md`;
- write independent behavioral tests.

Forbidden:
- copy/paste upstream implementations;
- transliterate Clojure/ClojureScript functions into TypeScript;
- preserve upstream implementation structure merely to mimic source code.

## Stop conditions

Do not silently improvise if:
- a behavior is ambiguous between file graphs and DB graphs;
- upstream docs and executable behavior conflict;
- a change would alter a public compatibility contract;
- a destructive schema migration has no migration/rollback plan.

In these cases, document the conflict in the OpenSpec change and choose behavior only from executable upstream evidence or an explicit product decision.

## Completion

A task is not complete because code compiles. It is complete only when its phase exit criteria in `docs/IMPLEMENTATION-ROADMAP.md` pass.
