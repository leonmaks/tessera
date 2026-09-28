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

## Five-line phase defense contract

Every one of the 13 roadmap phases SHALL pass five independent lines of defense:

1. OpenSpec SHALL define the active change, allowed behavior, exact implementation scope, scenarios, dependencies and exit criteria.
2. This file SHALL define implementation prohibitions and architecture invariants. An agent SHALL stop rather than silently weakening them.
3. BDD, Vitest/TDD, fast-check, Playwright and differential tests SHALL define observable behavior, structural invariants and upstream evidence before the related production implementation is accepted.
4. An executable phase gate SHALL check the active change, frozen baseline, changed-file scope, required commands, OpenSpec state, model policy and evidence integrity.
5. A fresh read-only independent reviewer SHALL issue PRE PASS before production implementation and POST PASS before archive. The implementer SHALL NOT approve its own work.

The complete lifecycle is defined in [docs/PHASE-QUALITY-GATES.md](docs/PHASE-QUALITY-GATES.md), and the model assignments and handoff prompt are defined in [docs/workflow-models.md](docs/workflow-models.md). Run `pnpm check:phase-gate` for the safe audit; `pnpm phase:pre` and `pnpm phase:post` are hard transition gates.

### Stop progression and repair

- Any required test, typecheck, OpenSpec validation, parity run, boundary check, executable gate or independent review failure is a hard stop.
- After two unsuccessful fixes of the same deterministic defect, stop the patch loop and perform root-cause analysis before another production edit.
- A failed gate requires a repair in the active OpenSpec scope and a fresh review. Review reports, expected values, tolerances, seeds, fixtures and baselines MUST NOT be altered only to obtain PASS.
- Previous phases are read-only dependencies. A repair across a phase boundary requires an explicit OpenSpec decision and a new PRE gate.
- A new phase SHALL NOT start automatically after archive. The next phase remains disabled until a separate handoff checkpoint is reviewed.

### Model and review policy

The phase control record SHALL name the implementation, test/fix and independent review model classes. GLM-5.3-Flash-262k is suitable for bounded test/documentation work; Qwen3.8-Flash-Next-262k for parser/UI/BDD/property work; DeepSeek-V4-Flash-0731-262k for worker/runtime/parity integration. Migrations, distributed protocols, security, public compatibility, upstream conflicts and release/archive decisions REQUIRE a stronger independent reviewer outside that routine set.

The selected model is evidence metadata, not permission to bypass a gate. If the phase matrix requires escalation, the machine gate SHALL report `MODEL_SWITCH_REQUIRED` and implementation SHALL pause.
