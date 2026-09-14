## 1. Contracts and tests

- [x] 1.1 Add Phase 06 BDD and initially failing unit/property contracts for revision, stale children, and duplicate publication; verify with `pnpm test:bdd --tags @phase-06` and `pnpm exec vitest run tests/unit/render-subscriptions.test.ts`.

## 2. Worker and client delivery

- [x] 2.1 Implement the authoritative worker boundary, typed local port adapters, and frozen revision-aware client store; verify with `pnpm exec vitest run tests/unit/render-subscriptions.test.ts tests/property/render-store-invariants.test.ts`.

## 3. Evidence and closure

- [x] 3.1 Add a render parity scenario, run `pnpm test:parity`, `pnpm verify`, strict OpenSpec validation, sync the delta, and archive the change.
