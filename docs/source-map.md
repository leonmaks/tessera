# Source map

Maintain this table while implementing parity.

## 2026-09-15 local editor and upstream setup update

The live React editor now executes semantic operations against a serialized Node worker and filesystem SQLite. `tests/e2e/working-editor.spec.ts` verifies durable edits, caret/keyboard behavior, actual tree controls, errors, two tabs, Markdown download and responsive sizing. `tests/unit/editor-worker.test.ts` terminates and restarts a real Node worker and checks acknowledged data. This supersedes the old Phase 07 smoke-screen evidence, but does not establish upstream editor parity.

The exact baseline `be800f171172c259d4dd942346e4d247a0783738` has now been fetched into ignored `.reference/logseq` (earlier entries saying no checkout describe the earlier state). Inspected the pinned `deps/outliner/README.md`, `deps/outliner/package.json`, `deps/outliner/nbb.edn`, `.github/workflows/deps-outliner.yml`, `docs/develop-logseq*.md` and outliner test entry points to identify the supported nbb test route. No implementation was copied or transliterated. Local setup includes locked outliner npm dependencies, built native SQLite binding, and portable Babashka/Clojure tools. Merely preparing or passing upstream's own tests must not be counted as candidate/reference differential evidence.

The pinned upstream outliner suite subsequently executed successfully: 105 tests / 380 assertions. A focused `logseq.outliner.op-test/collapse-expand-blocks-op` run also passed (1 test / 2 assertions), establishing that upstream persists `:block/collapsed?` through graph transactions. This conflicts with Tessera's current local-only collapse specification. The product decision is open; no candidate behavior or compatibility normalizer was silently changed.

Full phase gates remain open. See `openspec/changes/working-editor/verification.md` for actual test results and limits.

| Capability | Upstream path / evidence | Pinned SHA | Candidate tests | Notes |
|---|---|---:|---|---|
| Worker authority | `docs/agent-guide/implemented/architecture/2026-08-24-logseq-runtime-and-engineering-guide.md` | TBD | render/worker contracts | Worker DB authoritative |
| Plugin types | `libs/src/LSPlugin.ts` | be800f171172c259d4dd942346e4d247a0783738 | plugin contract/parity tests | Preserve targeted `DB`, `Editor`, `Commands` shapes without raw DB writes |
| DB queries | `libs/guides/db_query_guide.md` | TBD | query parity | DSL + Datalog |
| DB properties | `libs/guides/db_properties_guide.md` | TBD | property parity | First-class property entities |
| Markdown mirror | `docs/logseq-markdown-syntax.md` | TBD | import/export golden tests | Semantic round trip |

## Phase 00 harness evidence

Baseline inspected: `upstream/baseline.json`, commit `be800f171172c259d4dd942346e4d247a0783738`, status `PINNED`. No repinning was performed.

`tests/parity/harness.test.ts` exercises independently authored synthetic providers and `tests/fixtures/parity/harness/canonical.json`. These are harness contract checks, not upstream behavioral parity. There is no local upstream checkout. An attempt to inspect `libs/src/LSPlugin.ts` at the pinned SHA through the web reader failed to fetch; no upstream source behavior was inferred from that attempt. The earlier TBD rows remain unverified and must be resolved during their behavioral phases.

Repository integration evidence: the installed Cucumber 13.2.1 loader (`lib/configuration/from_file.js`) reads an ESM default export as the default profile. The bootstrap's nested default object discovered zero scenarios. `tests/unit/bdd-config.test.ts` permanently reproduces detection through the real configuration API; after correction seven Phase 00 scenarios execute.

The pinned checkout is now verified by `pnpm baseline:run` before any upstream command is accepted. `packages/compatibility-oracle/src/upstream-runner.ts` rejects missing or mismatched checkouts; `scripts/run-pinned-upstream.mjs -- pnpm --dir deps/outliner test` is the reproducible command route for executing the upstream outliner suite. This verifies provenance and command routing, not candidate/reference parity by itself. The verification ledger records this distinction and the explicit `TESSERA-LOCAL-COLLAPSE` deviation.

## Phase 01 transaction evidence

Baseline inspected: `upstream/baseline.json`, commit `be800f171172c259d4dd942346e4d247a0783738`, status `PINNED`. GitHub's release listing identifies `be800f1` as a verified upstream commit; the upstream README documents the DB version as DB graphs. Phase 01 uses this bounded evidence, the DB-first authority contract in `docs/ARCHITECTURE.md`, and independently authored tests in `tests/unit/{transaction-engine,graph-pull,graph-db-migrations,graph-db-recovery,post-commit-listeners}.test.ts`.

The standard-library adapter is qualified against the project's Node floor: the [Node SQLite API](https://nodejs.org/api/sqlite.html) documents `DatabaseSync` as introduced in Node 22.5 and available without the experimental flag from Node 22.13. The local runtime test also opened, wrote and read an in-memory database through `node:sqlite`.

`tests/fixtures/parity/transaction-engine/create-entity.scenario.json` is executed against the TypeScript SQLite candidate. Its reference is explicitly `test-double`; it establishes normalizer and candidate fixture behavior only. Pinned executable upstream adapter: **UNAVAILABLE** — no local upstream checkout or runnable upstream graph harness is present. The report marks `compatible: false`; no L0 upstream parity is claimed.

## Phase 02 outliner evidence

Baseline inspected: `upstream/baseline.json`, commit `be800f171172c259d4dd942346e4d247a0783738`, status `PINNED`. The pinned upstream file [`deps/outliner/src/logseq/outliner/core.cljs`](https://github.com/logseq/logseq/blob/be800f171172c259d4dd942346e4d247a0783738/deps/outliner/src/logseq/outliner/core.cljs) was inspected as behavioral evidence only. Its move operation accepts a collection of blocks, derives top-level roots before moving, and transacts the operation after deriving structural changes. The independent TypeScript design therefore preserves root selection, hierarchy and single-commit behavior, but does not copy the implementation or its data representation.

`tests/fixtures/parity/outliner/{insert-after,structural-commands}.scenario.json` are executed through a runtime-validated common scenario schema. They cover insertion, single/multi move, indent, outdent, split, merge and deletion against the SQLite candidate and a declared static test double. Pinned executable upstream adapter: **UNAVAILABLE** — the repository has no runnable upstream graph harness. Reports set `compatible: false`; L1 upstream parity is not claimed.

## Phase 03 parser evidence

Baseline inspected: `upstream/baseline.json`, commit `be800f171172c259d4dd942346e4d247a0783738`, status `PINNED`. The pinned upstream syntax documentation is listed by the baseline as `docs/logseq-markdown-syntax.md`; it establishes the compatibility surface, while the implementation is independently scanner-based and does not copy upstream code. `tests/fixtures/parity/parser/page-and-code.scenario.json` checks a semantic page ref against an excluded code literal through the parser candidate and an explicit test double. Pinned executable upstream parser adapter: **UNAVAILABLE**; report `compatible: false`, so no L2 claim is made.

Committed derivation is now exercised by `tests/unit/editor-runtime.test.ts`: outliner mutations parse block content independently, persist one canonical `:references/semantic-json` fact in the same authoritative transaction, and the graph worker derives immutable exact backlinks from that committed fact. A code span replaces the fact and therefore removes the backlink without substring matching. This is candidate evidence only; it does not change the unavailable upstream-adapter status.

`tests/parity/parser-references.test.ts` now executes `page-and-code.scenario.json` through the independently authored upstream adapter script at the pinned graph-parser checkout. The adapter invokes upstream `logseq.graph-parser.mldoc/get-references`, normalizes only its returned page-reference AST nodes, and compares the same fixture with Tessera. This is `upstream-execution` evidence; code spans remain excluded on both sides.

## Phase 04 property/task evidence

Baseline inspected: `upstream/baseline.json`, commit `be800f171172c259d4dd942346e4d247a0783738`, status `PINNED`. The independently installed pinned `deps/db` test route was executed with `pnpm --dir .reference/logseq/deps/db test` and portable Babashka on PATH. It loads `logseq.db.frontend.class-test`, `property-test`, `property.type-test` and `logseq.db.sqlite.build-test`; the latter explicitly tests `:build/class-extends` cycle rejection and diamond inheritance. `sqlite/export_test.cljs` additionally has fixtures stating that identical journal pages are merged, and `sqlite/create_graph_test.cljs` checks the built-in Task class properties.

`tests/parity/properties-classes.test.ts` and `tests/parity/tasks-journals.test.ts` now run the independently-authored oracle at `deps/db/script/tessera_phase04_oracle.cljs` through `scripts/run-pinned-upstream.mjs`. The common fixture is `tests/fixtures/parity/phase04/db-observables.json`; candidate and oracle compare typed number preservation, class-cycle rejection, a task's observable classification/status, and date-canonical journal identity. The normalizer intentionally compares only public semantic observations: upstream represents task classification with `:logseq.class/Task` while Tessera represents it with committed `:task/status`; SQLite ids, idents, page formatting and transaction internals are excluded. This is executable pinned-upstream differential evidence for that bounded Phase 04 corpus.

`tests/fixtures/parity/properties/typed-number.scenario.json` remains an older explicit `test-double` harness fixture with `compatible: false`; it does not contribute to this parity claim. Tessera's durable semantic regression coverage is `tests/unit/semantic-services.test.ts`, including typed validation, canonical journal date identity across different requested UUIDs, serialized concurrent lookup, class-cycle rejection and property-name ordering.

## Phase 05 query evidence

Baseline inspected: `upstream/baseline.json`, commit `be800f171172c259d4dd942346e4d247a0783738`, status `PINNED`. `tests/parity/query-engine.test.ts` creates the independently-authored `tests/fixtures/parity/query/basic.edn` through the pinned `deps/db/script/create_graph.cljs` CLI and runs the same Datalog predicate through pinned `deps/db/script/query.cljs`. It compares only the public result `alpha task`; generated ontology entities, SQLite ids and storage layout are intentionally excluded. The runner uses `scripts/run-pinned-upstream.mjs`, verifies the pinned SHA first, and reports `upstream-execution` evidence.

Browser/Node command evidence: `tests/e2e/browser-worker.spec.ts` runs the same case-insensitive `page.create`/duplicate fixture in the browser OPFS worker and the Node semantic host. It compares public revision advancement, focus title and duplicate prevention; UUIDs, SQL rows and handles are excluded. The common independently-authored command resolver is `packages/graph-worker/src/portable-page-runtime.ts`. The current browser profile supports this portable slice only; unsupported editor commands remain outside this comparison rather than being proxied to Node.

## Phase 06 renderer evidence

Baseline inspected: `upstream/baseline.json`, commit `be800f171172c259d4dd942346e4d247a0783738`, status `PINNED`. The baseline architecture guide identifies a worker-owned graph runtime, but no runnable pinned renderer adapter is present. `tests/fixtures/parity/render/stale-child-patch.scenario.json` exercises the independently authored revision-aware store through an explicit test double and reports `compatible: false`; no L5 claim is made.

## Phase 07 editor evidence

Baseline inspected: `upstream/baseline.json`, commit `be800f171172c259d4dd942346e4d247a0783738`, status `PINNED`. No runnable upstream browser editor adapter is available. `tests/fixtures/parity/editor/enter-split.scenario.json` runs the independently authored semantic-intent controller against an explicit test double, reports `compatible: false`, and makes no L5 claim.

## Phase 08 import/export evidence

Baseline inspected: `upstream/baseline.json`, commit `be800f171172c259d4dd942346e4d247a0783738`, status `PINNED`. The pinned Markdown syntax guide defines the surface; no runnable upstream import/export adapter is available. `tests/fixtures/parity/import-export/reference-round-trip.scenario.json` uses an explicit test double and reports `compatible: false`.

## Phase 09 search evidence

Baseline inspected: `upstream/baseline.json`, commit `be800f171172c259d4dd942346e4d247a0783738`, status `PINNED`. No runnable upstream search adapter is available. `tests/fixtures/parity/search/keyword.scenario.json` uses an explicit test double and reports `compatible: false`.

## Phase 10 plugin evidence

Baseline inspected: `upstream/baseline.json`, commit `be800f171172c259d4dd942346e4d247a0783738`, status `PINNED`. The pinned upstream [`libs/src/LSPlugin.ts`](https://github.com/logseq/logseq/blob/be800f171172c259d4dd942346e4d247a0783738/libs/src/LSPlugin.ts) defines `IDBProxy.q`, `customQuery`, `datascriptQuery`, `onChanged`; semantic `IEditorProxy` block methods; and an executable command registry. It also defines the command placements targeted by this bounded facade. The TypeScript implementation is independently authored around injected semantic ports, does not import a database package, projects public UUID-addressed facts, and catches post-commit handler failures without changing the already committed operation.

`tests/fixtures/parity/plugins/command-execution.scenario.json` is validated by the shared compatibility scenario schema and executed through the plugin host candidate against an explicit test double. Pinned executable upstream adapter: **UNAVAILABLE** — reports set `compatible: false`; no upstream parity claim is made.
