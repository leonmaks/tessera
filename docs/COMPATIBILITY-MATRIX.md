# Compatibility matrix

| Level | Scope | Release gate |
|---|---|---|
| L0 | storage + transaction invariants | required |
| L1 | graph/outliner | required |
| L2 | parser/import/export | required |
| L3 | properties/classes/tasks/journals | required |
| L4 | simple query + Datalog | required |
| L5 | editor interaction | required |
| L6 | plugin API subset | required for plugin-compatible release |
| L7 | RTC/sync | required for collaborative release |
| L8 | search/graph view/extended projections | required for feature-complete release |

For every row maintain a fixture count, upstream evidence, candidate test suite and known deviations. A known deviation must be explicit; it must never be silently normalized away.

## Phase 00 status

Harness corpus: one synthetic canonical fixture, exercised by `tests/parity/harness.test.ts`; seven executable scenarios in `tests/bdd/features/harness.feature`. Baseline SHA is `be800f171172c259d4dd942346e4d247a0783738`. Reports distinguish test doubles from upstream execution and never claim compatibility for test doubles.

L0–L8 each currently have zero verified upstream parity fixtures. No level is claimed compatible. The pre-existing outliner scenario is an unexecuted seed for Phase 02. No intentional Logseq semantic deviation was introduced; actual graph providers and source-backed parity evidence remain for later phases.

## Phase 01 status

L0 candidate corpus: one deterministic transaction fixture and 11 transaction/recovery/listener/pull contracts plus one fast-check sequence invariant. The fixture executes against the TypeScript SQLite candidate and a declared test double only. Pinned upstream graph execution is `UNAVAILABLE`; fixture reports set `compatible: false`. No L0 upstream compatibility is claimed.
