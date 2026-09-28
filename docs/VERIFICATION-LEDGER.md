# Verification ledger

This ledger is the release evidence source for `complete-roadmap-features`. It separates candidate tests from differential execution against the pinned Logseq reference. A passing row with only candidate or test-double evidence is not a compatibility claim.

## Evidence vocabulary

| Kind | Meaning | Can close an upstream parity gate? |
|---|---|---|
| Candidate | Independently authored Tessera unit, property, BDD, browser or package test | No |
| Test double | A fixture provider declared as `test-double` by the compatibility oracle | No |
| Source inspection | Pinned upstream documentation or tests inspected for behavior | No |
| Upstream execution | The same runtime-validated fixture executed by an adapter against commit `be800f171172c259d4dd942346e4d247a0783738` | Yes |

The reference checkout at `.reference/logseq` resolves to the pinned commit. Its presence is not itself upstream execution evidence. Every upstream-executed fixture must record its command, adapter, normalized snapshots, and result in `docs/source-map.md`.

## Roadmap inventory — 2026-09-16

| Phase | Capability packages / surface | Candidate coverage present | Current reference evidence | Open exit gate |
|---|---|---|---|---|
| 00 | `platform`, `compatibility-oracle`, boundary checker | Harness BDD and parity contracts | Test double; pinned checkout available | Runnable reference adapter and malformed-input provenance scenarios |
| 01 | `domain`, `graph-db`, `graph-worker` | Transaction, recovery, migration, pull and invariant tests | Test double | Reopen/migration family coverage and executable reference fixture |
| 02 | `outliner` | BDD, command contracts, structural property tests | Test double | Full structural fixture execution against reference |
| 03 | `parser`, `references` | Parser/reference contracts, BDD, code-exclusion property test | Test double; source inspection | AST limits, aliases/namespaces/backlinks and reference adapter |
| 04 | `properties`, `tasks`, `journals` | Typed property/task/journal unit and BDD tests | Test double; source inspection | Durable worker commands, repeat behavior and reference fixtures |
| 05 | `query-engine` | Query BDD, evaluator contracts, invariants and a real pinned-upstream predicate fixture | Pinned upstream execution for one bounded fixture; source inspection | Broader Datalog corpus and browser semantic comparison |
| 06 | `graph-client`, `graph-worker`, render store | Delta, stale-patch, ordering, OPFS worker and shared `page.create` browser/Node E2E contract | Candidate/browser execution | Migrate additional editor commands through portable runtime ports |
| 07 | `editor-ui`, `apps/web`, Electron shell | Playwright editor and local worker scenarios | Test double | Feature surfaces through snapshots and executable editor comparison |
| 08 | `import-export` | Markdown/Org round-trip and limit tests | Test double; source inspection | Worker-mediated transactions, assets and reference round-trip corpus |
| 09 | `search`, `graph-projection` | Rebuild/index/projection unit and property tests | Test double | Worker integration, semantic provider bounds and reference evidence |
| 10 | `plugin-host`, `plugin-sdk` | Host/SDK contracts and plugin fixture | Test double; source inspection | Compatibility plugin and semantic worker facade |
| 11 | `desktop-cli-runtime`, `apps/cli`, `apps/desktop` | Daemon/desktop lifecycle tests and desktop browser tests | Test double | Backup/restore, route auth and upstream/non-equivalence record |
| 12 | `sync-protocol`, `sync-client`, `services/sync-server` | Runtime and stale-retry tests | Test double | Ordered semantic batches, convergence fuzzing and protocol evidence |
| 13 | `remote-api` | Contract and raw-write rejection tests | Test double | Versioned API, scope/E2EE/limits tests and executable evidence |

## Named deviations

| Id | Scope | Status | Rationale |
|---|---|---|---|
| `TESSERA-LOCAL-COLLAPSE` | L5 block collapse | Accepted product deviation | Collapse is local renderer state and is never a graph transaction, whereas the pinned DB-Logseq outliner evidence persists it. |

No other deviation is accepted. A conflict between file-graph and DB-graph behavior must be entered into an OpenSpec update before implementation of the affected behavior continues.

## Qualification rule

For each phase, retain the failing test introduced before production code, the green candidate result, the parity fixture, and its provenance. Mark a phase as qualified only after its roadmap exit command and at least one relevant `upstream-execution` result have passed (unless the roadmap task explicitly records that executable upstream evidence is unavailable). Test-double reports always retain `compatible: false`.
