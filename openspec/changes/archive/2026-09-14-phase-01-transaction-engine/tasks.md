## 1. Evidence and executable behavior

- [x] 1.1 Record pinned upstream DB-first authority/transaction evidence and Phase 01 fixture boundaries in `docs/source-map.md`; verify with `pnpm test:parity`.
- [x] 1.2 Add Phase 01 Gherkin scenarios for typed facts, atomic failure, idempotent operation replay, pull absence, listener isolation, migrations and reopen recovery; verify with `pnpm test:bdd --tags @phase01`.
- [x] 1.3 Add the smallest failing Vitest contracts for domain validation, deterministic canonical reports, pull reads and migration recovery; verify with `pnpm exec vitest run tests/unit/graph-db-migrations.test.ts tests/unit/transaction-engine.test.ts`.

## 2. Transaction foundation

- [x] 2.1 Define strict domain transaction assertions, typed values, UUID validation, public report/read outcomes and a graph-db port without runtime dependencies; verify with `pnpm exec vitest run tests/unit/domain-transaction.test.ts` and `pnpm typecheck`.
- [x] 2.2 Qualify the Node SQLite adapter against the stated Node version and keep it behind graph-db/platform interfaces; verify with `pnpm exec vitest run tests/unit/sqlite-adapter.test.ts`.
- [x] 2.3 Implement versioned atomic schema migration, graph reopen and recovery behavior; verify with `pnpm exec vitest run tests/unit/graph-db-migrations.test.ts tests/unit/graph-db-recovery.test.ts`.
- [x] 2.4 Implement validated atomic EAV commits, UUID identity allocation, revision advancement, canonical reports and idempotent operation replay; verify with `pnpm exec vitest run tests/unit/transaction-engine.test.ts`.
- [x] 2.5 Implement UUID-addressed immutable pull projections and isolated post-commit listeners; verify with `pnpm exec vitest run tests/unit/graph-pull.test.ts tests/unit/post-commit-listeners.test.ts`.

## 3. Invariants, parity and closure

- [x] 3.1 Add fast-check transaction-sequence invariants for atomicity, monotonic revision, UUID uniqueness and replay idempotency; verify with `pnpm test:property`.
- [x] 3.2 Add deterministic Phase 01 parity fixtures and execute them against the candidate and any available pinned upstream reference adapter; record an explicit `UNAVAILABLE` deviation only if the reference adapter cannot execute; verify with `pnpm test:parity`.
- [x] 3.3 Run Phase 01 exits and full verification; verify with `pnpm check:specs`, `pnpm check:boundaries`, `pnpm exec vitest run tests/unit/transaction-engine.test.ts tests/unit/graph-db-recovery.test.ts`, `pnpm test:property`, and `pnpm verify`.
- [x] 3.4 Synced all three delta specs after validating the main specs, archived after commit `91bbcec` contained parity evidence and fixtures, and verified with `pnpm exec openspec validate --specs`.
