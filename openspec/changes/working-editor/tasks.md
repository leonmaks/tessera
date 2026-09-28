## 1. Worker and persistence

- [x] 1.1 Add BDD scenarios and failing worker persistence/validation tests; verify with `pnpm exec vitest run tests/unit/editor-runtime.test.ts`.
- [x] 1.2 Implement validated serialized SQLite worker and local transport; verify with `pnpm exec vitest run tests/unit/editor-runtime.test.ts`.

## 2. Editor

- [x] 2.1 Implement graph client and page/block UI; verify with `pnpm exec playwright test tests/e2e/working-editor.spec.ts`.
- [x] 2.2 Verify draft recovery, caret, nesting, history, multi-tab and restart; run `pnpm test:bdd --tags @working-editor` and `pnpm test:e2e`.

## 3. Delivery

- [ ] 3.1 Record evidence and limits, run `pnpm verify`, `pnpm test:parity`, `pnpm build:web`, and `openspec validate working-editor --strict`; archive only when the change criteria pass.

Product decision resolved: preserve renderer-local collapse as `TESSERA-LOCAL-COLLAPSE`. Existing collapse tests remain required. Report this intentional difference separately from unqualified behaviors; the decision does not mark delivery or all roadmap phases complete.
