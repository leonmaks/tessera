# Implementation roadmap

The phases are intentionally ordered by dependency. Do not build UI-first.

## Phase 00 — Repository and parity harness

Deliver:
- baseline pinning;
- OpenSpec + Codex integration;
- deterministic UUID/clock ports;
- canonical snapshot schema;
- candidate/reference provider interfaces;
- architecture boundary checks.

Exit:
```bash
pnpm check:specs
pnpm check:boundaries
pnpm test -- tests/parity/harness.test.ts
```

## Phase 01 — Graph model and transaction engine

Deliver:
- entity/attribute/value logical model;
- SQLite schema and migrations;
- transaction commit/report;
- UUID identity;
- monotonic revision;
- pull/read API;
- atomic operation metadata.

Exit:
- transaction tests green;
- recovery tests green;
- no raw write outside graph-db;
- canonical snapshots deterministic.

## Phase 02 — Outliner core

Deliver:
- insert/update/delete;
- parent/order/page semantics;
- move subtree;
- indent/outdent;
- split/merge;
- multi-block moves;
- undo/redo grouping.

Exit:
- BDD outliner feature green;
- fast-check structural invariants green for randomized command sequences;
- parity fixtures for all structural commands.

## Phase 03 — Parser and references

Deliver:
- Markdown + Org block parsing;
- inline AST;
- page refs, block refs, tags, code spans/fences;
- reference extraction and backlinks;
- aliases/namespaces foundation.

Exit:
- golden parser fixtures;
- reference parity;
- no regex-only semantic parser.

## Phase 04 — Properties, tags/classes, tasks, journals

Deliver:
- typed property definitions/values;
- cardinality/constraints;
- class/tag inheritance DAG;
- effective property calculation;
- task class/status/priority/date semantics;
- repeating task behavior;
- journal identity/navigation.

Exit:
- properties/tasks BDD green;
- inheritance property tests;
- parity fixtures.

## Phase 05 — Query engine

Deliver:
- simple query parser/compiler;
- Datalog `:find/:in/:where`;
- unification and joins;
- `pull`;
- `and/or/not/or-join/not-join`;
- predicates, aggregates, rules.

Exit:
- query parity corpus against upstream;
- deterministic ordering policy documented;
- query timeout/resource guards.

## Phase 06 — Worker RPC and renderer subscriptions

Deliver:
- typed command/query RPC;
- platform adapter;
- browser worker and Node worker adapters;
- render affected-resource calculation;
- immutable external store;
- stale patch reload behavior.

Exit:
- render delta contract tests;
- no renderer graph authority;
- duplicate publication test.

## Phase 07 — React editor/UI

Deliver:
- block tree;
- editor selection/focus;
- Enter/Backspace/Delete/Tab/Shift+Tab;
- collapse/expand;
- multi-selection;
- drag/drop;
- command/keymap layer.

Exit:
- Playwright editor parity scenarios;
- browser worker integration;
- no direct DB dependency from apps.

## Phase 08 — Import/export and assets

Deliver:
- legacy Markdown/Org import;
- DB->Markdown mirror/export;
- asset metadata/content split;
- semantic round trip;
- large/deep input handling.

Exit:
- import fixture corpus;
- export->import semantic equality.

## Phase 09 — Search and graph projection

Deliver:
- incremental FTS;
- semantic search provider boundary;
- ranking fusion;
- graph projection;
- graph view size caps.

Exit:
- index rebuild equivalence;
- incremental indexing tests;
- bounded graph projection tests.

## Phase 10 — Plugin compatibility

Deliver:
- plugin host/capability API;
- Editor/DB/App/Commands facade;
- change events;
- command registration;
- UI slots as a separate host concern.

Exit:
- compatibility test plugin;
- raw DB writes unavailable to plugins.

## Phase 11 — Desktop/CLI runtime

Deliver:
- graph-bound daemon;
- graph lock;
- server list;
- health/invoke/events/shutdown routes;
- backup via SQLite backup API;
- CLI client.

Exit:
- concurrent writer prevention;
- stale daemon recovery;
- backup restore tests.

## Phase 12 — RTC/sync

Deliver:
- server `t` ordering;
- hello/pull/tx batch;
- stale rejection;
- client pull/rebase/retry;
- presence;
- snapshots/checksums;
- partial-success reporting.

Exit:
- convergence simulations;
- disconnect/reorder/duplicate tests;
- checksum reconciliation.

## Phase 13 — Remote semantic API and hardening

Deliver:
- `/api/v1`;
- graph/page/block/property/task/tag/asset/search semantic operations;
- auth scopes/authorization hooks;
- E2EE fail-closed boundary;
- limits and observability.

Exit:
- OpenAPI/contract tests;
- no raw datom write endpoint;
- security failure tests.

## Global phase rule

For each phase:

`OpenSpec -> BDD -> failing TDD/property test -> implementation -> upstream parity -> pnpm verify -> archive`.
