## 1. Contracts and red tests

- [x] 1.1 Add Phase 07 BDD, unit and Playwright interaction contracts for key intents and stale reload; verify with `pnpm test:bdd --tags @phase-07` and `pnpm exec playwright test --grep @phase-07`.

## 2. Editor implementation

- [x] 2.1 Add a React editor shell, ephemeral interaction reducer and semantic gateway; verify with `pnpm exec vitest run tests/unit/editor-ui.test.ts` and `pnpm exec playwright test --grep @phase-07`.

## 3. Evidence and closure

- [x] 3.1 Add L5 parity evidence, run `pnpm test:parity`, `pnpm verify`, strict OpenSpec validation, sync and archive; verify with those commands.
