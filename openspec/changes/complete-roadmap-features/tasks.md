## 1. Baseline, contracts and durable authority

- [x] 1.1 Inventory every existing package scaffold, test double and unresolved phase gate against the 00–13 roadmap; add a verification ledger that distinguishes executable pinned-upstream evidence from candidate-only tests. Verify with `pnpm exec openspec validate complete-roadmap-features --strict` and `pnpm test -- tests/parity/harness.test.ts`.
- [x] 1.2 Add real pinned-upstream runner setup and BDD coverage for baseline provenance, named deviations and malformed parity inputs before changing production capabilities. Verify with `pnpm test:bdd -- --tags @baseline` and `pnpm test -- tests/parity/harness.test.ts`.
- [x] 1.3 Qualify the shared durable EAV/migration and semantic-command foundation with migration/reopen/property tests before any feature-specific schema code. Each newly durable family remains tested and implemented in its own phase; no raw-write escape hatch is introduced. Verify with `pnpm test -- tests/unit/graph-db-foundation.test.ts tests/property/transaction-engine-invariants.test.ts tests/unit/render-subscriptions.test.ts` and `pnpm check:boundaries`.

## 2. Parsing, references and semantic projections

- [x] 2.1 Add parser/reference BDD and failing golden/property tests for Markdown/Org nesting, inline nodes, code exclusion, aliases, namespaces, backlinks and malformed limits. Verify with `pnpm test:bdd -- --tags @parser-references` and `pnpm test -- tests/unit/parser-references.test.ts tests/property/parser-references.test.ts`.
- [x] 2.2 Implement semantic AST parsing, deterministic reference materialization and immutable backlink/page projections through worker commands and committed derivation. Verify with `pnpm test -- tests/unit/parser-references.test.ts tests/property/parser-references.test.ts tests/unit/graph-worker.test.ts`.
- [x] 2.3 Execute parser/reference fixtures against the pinned upstream provider and retain every discrepancy fixture with source mapping. Verify with `pnpm test:parity -- tests/parity/parser-references.test.ts`.

## 3. Properties, classes, tasks and journals

- [x] 3.1 Add BDD and failing unit/property tests for typed property schemas, cardinality migration safety, class DAGs, effective inheritance, task transitions/repeats and canonical journal dates. Verify with `pnpm test:bdd -- --tags @properties,@tasks-journals` and `pnpm test -- tests/unit/properties.test.ts tests/unit/tasks-journals.test.ts tests/property/properties.test.ts`.
- [x] 3.2 Implement durable typed property/class/task/journal semantic commands, transactional repeat behavior and deterministic effective-property reads in the graph worker. Verify with `pnpm test -- tests/unit/properties.test.ts tests/unit/tasks.test.ts tests/unit/journals.test.ts tests/unit/semantic-services.test.ts tests/unit/graph-worker.test.ts`.
- [x] 3.3 Add pinned-upstream fixtures and source mapping for each supported property/task/journal behavior, documenting any DB/file-graph conflict before proceeding. Verify with `pnpm test:parity -- tests/parity/properties-classes.test.ts tests/parity/tasks-journals.test.ts`.

## 4. Queries and worker/browser integration

- [x] 4.1 Add query BDD and failing tests for simple queries, Datalog clauses, pull, logical operators, predicates/aggregates/rules and deterministic resource limits. Verify with `pnpm test:bdd -- --tags @query-engine` and `pnpm test -- tests/unit/query-engine.test.ts tests/property/query-engine-invariants.test.ts`.
- [x] 4.2 Implement a bounded Datalog-compatible parser/evaluator over authoritative graph reads; expose validated worker/plugin/API query commands without JavaScript-filter compatibility shortcuts. Verify with `pnpm test -- tests/unit/query-engine.test.ts tests/property/query-engine-invariants.test.ts tests/unit/graph-worker.test.ts`.
- [x] 4.3 Add browser worker SQLite/OPFS adapter, immutable external store and revision-aware subscription/delta tests; ensure stale children reload and no command/subscription duplicate application occurs. Verify with `pnpm test -- tests/unit/render-subscriptions.test.ts tests/unit/graph-worker.test.ts` and `pnpm test:e2e -- --grep "browser worker|stale"`.
- [x] 4.4 Run true upstream query fixtures and browser-versus-Node semantic command comparisons, retaining source evidence and named deviations. Verify with `pnpm test:parity -- tests/parity/query-engine.test.ts` and `pnpm test:e2e -- --grep "browser worker"`.

## 5. Editor surfaces, import/export and assets

- [ ] 5.1 Add Playwright/BBD regressions for rich editor command/keymap coverage, references/backlinks, properties, tasks, journals, query views and graph projection while retaining local collapse. Verify with `pnpm test:bdd -- --tags @editor-ui` and `pnpm test:e2e -- --grep "editor|property|task|journal|backlink"`.
- [ ] 5.2 Implement renderer surfaces exclusively through graph-client snapshots and semantic commands; add property/task/journal/query/backlink/graph-view UI without direct database access. Verify with `pnpm test:e2e` and `pnpm check:boundaries`.
- [ ] 5.3 Add import/export/assets BDD and failing round-trip/limit tests for Markdown/Org hierarchy, references, properties, tasks and asset metadata. Verify with `pnpm test:bdd -- --tags @import-export` and `pnpm test -- tests/unit/import-export.test.ts tests/property/import-export.test.ts`.
- [ ] 5.4 Implement worker-mediated import/export, portable asset metadata and SQLite-consistent import rollback; wire user-facing import/export flows in web and Electron. Verify with `pnpm test -- tests/unit/import-export.test.ts tests/property/import-export.test.ts` and `pnpm test:e2e -- --grep "import|export"`.
- [ ] 5.5 Execute supported import/export fixtures against the pinned baseline and retain semantic round-trip regression corpus. Verify with `pnpm test:parity -- tests/parity/import-export.test.ts`.

## 6. Search, graph projection and plugins

- [ ] 6.1 Add failing BDD/unit/property tests for committed incremental keyword index effects, rebuild equivalence, semantic-provider limits and bounded deterministic graph projection. Verify with `pnpm test:bdd -- --tags @search,@graph-projection` and `pnpm test -- tests/unit/search.test.ts tests/unit/graph-projection.test.ts tests/property/search.test.ts`.
- [ ] 6.2 Implement post-commit rebuildable search and graph-projection services behind worker query commands; surface bounded results in the UI without giving indexes graph authority. Verify with `pnpm test -- tests/unit/search.test.ts tests/unit/graph-projection.test.ts tests/property/search.test.ts tests/unit/graph-worker.test.ts`.
- [ ] 6.3 Add plugin BDD and failing compatibility-plugin tests for capability-only mutations, Datalog facade, event operation context, deterministic command registration and isolated handler failures. Verify with `pnpm test:bdd -- --tags @plugins` and `pnpm test -- tests/unit/plugin-host.test.ts tests/unit/plugin-sdk.test.ts`.
- [ ] 6.4 Implement the plugin host/SDK through semantic worker commands and UI slots, retaining no raw SQLite capability and no post-commit rollback. Verify with `pnpm test -- tests/unit/plugin-host.test.ts tests/unit/plugin-sdk.test.ts tests/unit/graph-worker.test.ts` and `pnpm check:boundaries`.
- [ ] 6.5 Run search/projection/plugin pinned-upstream fixtures where evidence exists; otherwise record the explicit unsupported or non-executable limitation without test-double claims. Verify with `pnpm test:parity -- tests/parity/plugins.test.ts tests/parity/search.test.ts tests/parity/graph-projection.test.ts`.

## 7. Desktop daemon, CLI and backup

- [ ] 7.1 Add BDD and failing runtime tests for authenticated graph-bound daemon routes, concurrent ownership, stale recovery, event delivery, semantic invoke rejection and SQLite-consistent backup/restore. Verify with `pnpm test:bdd -- --tags @desktop-cli-runtime` and `pnpm test -- tests/unit/desktop-cli-runtime.test.ts tests/unit/backup.test.ts`.
- [ ] 7.2 Implement production daemon/CLI routes and backup adapter through graph-worker semantic ports, preserving Electron host behavior and one-writer ownership. Verify with `pnpm test -- tests/unit/desktop-cli-runtime.test.ts tests/unit/backup.test.ts` and `pnpm test:desktop`.
- [ ] 7.3 Add daemon/CLI upstream provenance or a documented non-equivalence boundary; run package, recovery and restore regressions. Verify with `pnpm package:desktop`, `pnpm test:desktop`, and `pnpm test:parity -- tests/parity/desktop-cli-runtime.test.ts`.

## 8. Ordered sync and remote semantic API

- [ ] 8.1 Add BDD and failing convergence/property tests for ordered batches, stale pull/rebase/retry, duplicate/reordered/disconnected delivery, checksums, snapshots, partial results and ephemeral presence. Verify with `pnpm test:bdd -- --tags @sync` and `pnpm test -- tests/unit/sync-runtime.test.ts tests/property/sync-convergence.test.ts`.
- [ ] 8.2 Implement sync server/client adapters over ordered semantic operations, never raw datoms; make presence ephemeral and expose actionable partial failures. Verify with `pnpm test -- tests/unit/sync-runtime.test.ts tests/property/sync-convergence.test.ts tests/unit/graph-worker.test.ts`.
- [ ] 8.3 Add remote API BDD and failing contract/security tests for operation schemas, scopes, E2EE fail-closed boundary, limits, observability and raw-write denial. Verify with `pnpm test:bdd -- --tags @remote-api` and `pnpm test -- tests/unit/remote-api.test.ts tests/property/remote-api.test.ts`.
- [ ] 8.4 Implement versioned HTTP semantic operations that delegate only to graph-worker ports; add authorization hooks and bounded observability without secrets in responses. Verify with `pnpm test -- tests/unit/remote-api.test.ts tests/property/remote-api.test.ts` and `pnpm check:boundaries`.
- [ ] 8.5 Run sync/API compatibility evidence against the pinned baseline where executable and document protocol differences or unsupported upstream evidence explicitly. Verify with `pnpm test:parity -- tests/parity/sync.test.ts tests/parity/remote-api.test.ts`.

## 9. Full qualification and release audit

- [ ] 9.1 Complete current `working-editor` and `electron-desktop-client` exit audits only after their documented evidence gates pass, updating verification records without overstating compatibility. Verify with `pnpm exec openspec validate working-editor --strict`, `pnpm exec openspec validate electron-desktop-client --strict`, `pnpm test:e2e`, and `pnpm test:desktop`.
- [ ] 9.2 Run all roadmap gates, source-map audit and real upstream differential corpus; record phase-by-phase pass/fail evidence and preserve unresolved gates instead of weakening tests. Verify with `pnpm test:bdd`, `pnpm test:property`, `pnpm test:parity`, `pnpm test:e2e`, `pnpm test:desktop`, `pnpm build:web`, `pnpm build:desktop`, `pnpm package:desktop`, `pnpm verify`, and `pnpm exec openspec validate --all --strict`.
- [ ] 9.3 Sync or archive only the changes whose own tasks, committed regression fixtures, provenance, migrations and roadmap exit criteria are all complete; leave remaining work active. Verify with `pnpm exec openspec status --change complete-roadmap-features` and `pnpm exec openspec validate complete-roadmap-features --strict`.
