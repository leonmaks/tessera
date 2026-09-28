# Verification — working-editor

Date: 2026-09-15. Scope: local-hosted plain-text editor, not completion of roadmap phases 00–13.

## Evidence

| Dimension | Result |
|---|---|
| Implementation tasks | 4/5 checked; delivery gate remains open pending upstream qualification |
| Local requirements | 3/3 have implementation and regression coverage |
| Architecture | Worker owns filesystem SQLite; UI uses validated semantic commands and immutable snapshots |
| `pnpm verify` | 48 files, 99 tests passed; strict typecheck, specs and boundaries passed |
| `pnpm test:bdd` | 41 scenarios, 143 steps passed |
| `pnpm exec playwright test --retries=0` | 9 passed, no retry, separate test graph |
| `pnpm test:parity` | 14 files, 32 passed; test-double evidence is not upstream parity |
| `pnpm build:web` | Passed; local host responds on 127.0.0.1:4173 |
| `openspec validate working-editor --strict` | Passed |
| Pinned upstream outliner's own suite | 105 tests, 380 assertions, zero failures/errors |
| Pinned upstream collapse persistence reproducer | 1 test, 2 assertions, zero failures/errors |

## Requirement and regression mapping

- Durable text/structure: `packages/graph-worker/src/editor-runtime.ts`; `tests/unit/editor-runtime.test.ts`; actual worker termination/restart in `tests/unit/editor-worker.test.ts`; Gherkin `working-editor.feature`.
- Usable page/tree controls: `apps/web/src/main.tsx`; `tests/e2e/{editor,working-editor}.spec.ts` cover creation, title/Escape, search, export content, split/merge/caret, multiline/Delete, indent/outdent, collapse without revision changes, multi-selection/subtree deletion/undo, drag identity, desktop/mobile sizing.
- Failed saves: `packages/graph-client/src/editor-client.ts` and renderer pending drafts; browser tests abort real requests, force a stale revision, verify draft retention, explicit retry and cross-tab propagation.
- Permanent regressions include Escape incorrectly committing a rename, blur suppressing the retry click, and textarea clipping after viewport resize. Each was observed failing before its fix.

## Open release gate

CRITICAL for claiming all roadmap phases complete: no executable pinned upstream comparison has passed. Browser-only worker/WASM integration is also not implemented by this local Node-hosted profile. Existing archived phase artifacts must not be treated as proof that those gates passed. The local editor is usable, but this change is not archived while the required qualification remains open.

WARNING: full snapshots and in-memory host-session history are intended for small local graphs; no pagination or crash-proof draft persistence. Markdown download is not full-graph round-trip interchange. See README for operation and limits.

## Upstream preparation

Fetched and checked out exact baseline `be800f171172c259d4dd942346e4d247a0783738` into ignored `.reference/logseq`; tracked upstream files remain unmodified. The outliner supports its own nbb-based test route (`deps/outliner/README.md` and `.github/workflows/deps-outliner.yml`). Its 92 locked npm dependencies installed. Portable Babashka 1.12.215 and Clojure tools 1.12.4.1597 were downloaded from official releases and SHA-256 checked; native better-sqlite3 12.8.0 built successfully and opened an in-memory DB. Dependency resolution has encountered repeated GitHub connection resets. No compatibility claim is inferred from dependency installation.

After retrying transient dependency download failures, the pinned upstream outliner suite ran successfully: 105 tests / 380 assertions, zero failures/errors. A separate focused `collapse-expand-blocks-op` run passed 1 test / 2 assertions and confirms graph-persisted collapse, unlike Tessera's current local-only specification. This unresolved contract discrepancy is recorded in design.md and surfaced for a product decision. Current implementation and its regression tests remain unchanged. Passing upstream's own tests is not a differential comparison with Tessera and does not close the compatibility gate.

Resume the upstream test setup from `.reference/logseq/deps/outliner` with the portable tool paths added only to the command's environment:

```powershell
$env:PATH = 'E:\dev\codex\tessera\.reference\tools\babashka;' + $env:PATH
$env:DEPS_CLJ_TOOLS_DIR = 'E:\dev\codex\tessera\.reference\tools\clojure\ClojureTools'
pnpm test
pnpm exec nbb-logseq -cp test -m nextjournal.test-runner -n logseq.outliner.op-test -v logseq.outliner.op-test/collapse-expand-blocks-op
```
