# Source map

Maintain this table while implementing parity.

| Capability | Upstream path / evidence | Pinned SHA | Candidate tests | Notes |
|---|---|---:|---|---|
| Worker authority | `docs/agent-guide/implemented/architecture/2026-08-24-logseq-runtime-and-engineering-guide.md` | TBD | render/worker contracts | Worker DB authoritative |
| Plugin types | `libs/src/LSPlugin.ts` | TBD | plugin contract tests | Preserve public observable shapes where targeted |
| DB queries | `libs/guides/db_query_guide.md` | TBD | query parity | DSL + Datalog |
| DB properties | `libs/guides/db_properties_guide.md` | TBD | property parity | First-class property entities |
| Markdown mirror | `docs/logseq-markdown-syntax.md` | TBD | import/export golden tests | Semantic round trip |

## Phase 00 harness evidence

Baseline inspected: `upstream/baseline.json`, commit `be800f171172c259d4dd942346e4d247a0783738`, status `PINNED`. No repinning was performed.

`tests/parity/harness.test.ts` exercises independently authored synthetic providers and `tests/fixtures/parity/harness/canonical.json`. These are harness contract checks, not upstream behavioral parity. There is no local upstream checkout. An attempt to inspect `libs/src/LSPlugin.ts` at the pinned SHA through the web reader failed to fetch; no upstream source behavior was inferred from that attempt. The earlier TBD rows remain unverified and must be resolved during their behavioral phases.

Repository integration evidence: the installed Cucumber 13.2.1 loader (`lib/configuration/from_file.js`) reads an ESM default export as the default profile. The bootstrap's nested default object discovered zero scenarios. `tests/unit/bdd-config.test.ts` permanently reproduces detection through the real configuration API; after correction seven Phase 00 scenarios execute.

## Phase 01 transaction evidence

Baseline inspected: `upstream/baseline.json`, commit `be800f171172c259d4dd942346e4d247a0783738`, status `PINNED`. GitHub's release listing identifies `be800f1` as a verified upstream commit; the upstream README documents the DB version as DB graphs. Phase 01 uses this bounded evidence, the DB-first authority contract in `docs/ARCHITECTURE.md`, and independently authored tests in `tests/unit/{transaction-engine,graph-pull,graph-db-migrations,graph-db-recovery,post-commit-listeners}.test.ts`.

The standard-library adapter is qualified against the project's Node floor: the [Node SQLite API](https://nodejs.org/api/sqlite.html) documents `DatabaseSync` as introduced in Node 22.5 and available without the experimental flag from Node 22.13. The local runtime test also opened, wrote and read an in-memory database through `node:sqlite`.

`tests/fixtures/parity/transaction-engine/create-entity.scenario.json` is executed against the TypeScript SQLite candidate. Its reference is explicitly `test-double`; it establishes normalizer and candidate fixture behavior only. Pinned executable upstream adapter: **UNAVAILABLE** — no local upstream checkout or runnable upstream graph harness is present. The report marks `compatible: false`; no L0 upstream parity is claimed.

## Phase 02 outliner evidence

Baseline inspected: `upstream/baseline.json`, commit `be800f171172c259d4dd942346e4d247a0783738`, status `PINNED`. The pinned upstream file [`deps/outliner/src/logseq/outliner/core.cljs`](https://github.com/logseq/logseq/blob/be800f171172c259d4dd942346e4d247a0783738/deps/outliner/src/logseq/outliner/core.cljs) was inspected as behavioral evidence only. Its move operation accepts a collection of blocks, derives top-level roots before moving, and transacts the operation after deriving structural changes. The independent TypeScript design therefore preserves root selection, hierarchy and single-commit behavior, but does not copy the implementation or its data representation.

`tests/fixtures/parity/outliner/{insert-after,structural-commands}.scenario.json` are executed through a runtime-validated common scenario schema. They cover insertion, single/multi move, indent, outdent, split, merge and deletion against the SQLite candidate and a declared static test double. Pinned executable upstream adapter: **UNAVAILABLE** — the repository has no runnable upstream graph harness. Reports set `compatible: false`; L1 upstream parity is not claimed.

## Phase 03 parser evidence

Baseline inspected: `upstream/baseline.json`, commit `be800f171172c259d4dd942346e4d247a0783738`, status `PINNED`. The pinned upstream syntax documentation is listed by the baseline as `docs/logseq-markdown-syntax.md`; it establishes the compatibility surface, while the implementation is independently scanner-based and does not copy upstream code. `tests/fixtures/parity/parser/page-and-code.scenario.json` checks a semantic page ref against an excluded code literal through the parser candidate and an explicit test double. Pinned executable upstream parser adapter: **UNAVAILABLE**; report `compatible: false`, so no L2 claim is made.

## Phase 04 property/task evidence

Baseline inspected: `upstream/baseline.json`, commit `be800f171172c259d4dd942346e4d247a0783738`, status `PINNED`. The baseline names the upstream DB properties guide as evidence; no runnable adapter is present. `tests/fixtures/parity/properties/typed-number.scenario.json` exercises the candidate through an explicit test double, reports `compatible: false`, and makes no L3 claim.

## Phase 05 query evidence

Baseline inspected: `upstream/baseline.json`, commit `be800f171172c259d4dd942346e4d247a0783738`, status `PINNED`. The baseline names the DB query guide but no runnable pinned query adapter is available. `tests/fixtures/parity/query/task-status.scenario.json` uses an explicit test double and reports `compatible: false`; no L4 claim is made.

## Phase 06 renderer evidence

Baseline inspected: `upstream/baseline.json`, commit `be800f171172c259d4dd942346e4d247a0783738`, status `PINNED`. The baseline architecture guide identifies a worker-owned graph runtime, but no runnable pinned renderer adapter is present. `tests/fixtures/parity/render/stale-child-patch.scenario.json` exercises the independently authored revision-aware store through an explicit test double and reports `compatible: false`; no L5 claim is made.
