## 1. Observable contracts and red tests

- [x] 1.1 Add executable desktop BDD scenarios for every delta requirement, including local collapse, existing graph ownership, restart, close/save failure and export cancellation. Verify with `pnpm test:bdd`; record the expected desktop failures before production changes.
- [x] 1.2 Add failing runtime unit/property tests for canonical graph ownership, legacy live locks, authenticated host reuse, malformed messages, deadlines, resource cleanup and asset traversal. Verify the intended red assertions with `pnpm exec vitest run tests/unit/desktop-host.test.ts tests/property/desktop-host.test.ts`.
- [x] 1.3 Add failing desktop lifecycle contract tests for sender validation, navigation restrictions, dirty-close outcomes and native export cancellation. Verify with `pnpm exec vitest run tests/unit/desktop-lifecycle.test.ts`.

## 2. Shared production runtime

- [x] 2.1 Extract the reusable host through public package entry points, retaining the Vite adapter and worker-only SQLite authority; implement validation, authentication, bounded requests and rooted asset resolution to satisfy red tests. Verify with `pnpm exec vitest run tests/unit/desktop-host.test.ts tests/property/desktop-host.test.ts tests/unit/editor-worker.test.ts` and `pnpm check:boundaries`.
- [x] 2.2 Implement exclusive canonical graph ownership, safe stale-owner recovery, authenticated reuse and owned-resource shutdown without stealing legacy live locks. Verify with `pnpm exec vitest run tests/unit/desktop-host.test.ts tests/property/desktop-host.test.ts`.

## 3. Electron shell and build

- [x] 3.1 Pin Electron and build tooling, add `dev:desktop`, `build:desktop`, `package:desktop` and `test:desktop` scripts, and create a real Electron worker SQLite smoke test; prove it fails before wiring the production worker and passes afterward. Bundle main/worker/frontend without tsx or private source imports. Verify with `pnpm build:desktop`, `pnpm test:desktop` and `pnpm check:boundaries`.
- [x] 3.2 Create the isolated desktop window with stable `tessera://app` origin, exact authenticated graph proxy, restricted session/navigation/CSP and validated minimal lifecycle bridge. Keep the existing graph-client command path. Verify with `pnpm exec vitest run tests/unit/desktop-lifecycle.test.ts` and `pnpm test:desktop`.
- [x] 3.3 Add stable user-data graph selection, explicit `TESSERA_GRAPH_PATH`, visible data location, single-instance activation and actionable startup/worker errors. Add permanent failing regression fixtures before each behavior implementation. Verify with `pnpm test:desktop`.
- [x] 3.4 Implement draft-aware Save/Cancel/Discard closing, failure-preserving drafts and graceful owned-host shutdown, plus native Markdown save/cancel. Add UI regressions before implementation. Verify with `pnpm exec vitest run tests/unit/desktop-lifecycle.test.ts` and `pnpm test:desktop`.

## 4. Distribution and behavioral qualification

- [x] 4.1 Configure unsigned Windows x64 unpacked/zip distribution and packaged Playwright tests using an isolated temporary profile; launch from a path with spaces and a different working directory, without Vite or separately installed Node, block external network, edit, close and reopen. Verify with `pnpm package:desktop` and `pnpm test:desktop`.
- [x] 4.2 Add web-versus-desktop normalized editor scenarios for text, split, indent, move, undo, search, export and local collapse/revision invariants. Record cross-shell evidence separately from true upstream differential evidence and preserve `TESSERA-LOCAL-COLLAPSE`. Verify with `pnpm test:desktop` and `pnpm test:parity`; report any unfulfilled pinned-upstream parity gates instead of relabeling test doubles.
- [x] 4.3 Run complete integration gates and record exact results and artifact locations in change verification evidence. Verify with `pnpm test:bdd`, `pnpm test:e2e`, `pnpm test:desktop`, `pnpm build:web`, `pnpm build:desktop`, `pnpm package:desktop` and `pnpm verify`.

## 5. Handoff and exit criteria

- [x] 5.1 Document desktop commands, unsigned-distribution limitations, data/override locations, safe rollback and actual architecture decisions; map evidence to scoped roadmap exit criteria without claiming all Phase 11 or upstream parity completion. Verify with `pnpm check:specs` and `pnpm exec openspec validate electron-desktop-client --strict`.
- [ ] 5.2 Audit all scoped exit criteria and required regression/parity evidence before considering synchronization or archival. Leave the change active if any gate is unresolved; do not archive merely because builds pass. Verify with `pnpm exec openspec status --change electron-desktop-client` and `pnpm exec openspec validate --all --strict`.
