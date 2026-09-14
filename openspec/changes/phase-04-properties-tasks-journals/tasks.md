## 1. Behavioral contracts

- [x] 1.1 Add Phase 04 BDD for typed values, DAG, task cycle/repeat and journals; verify with `pnpm test:bdd --tags @phase-04`.
- [x] 1.2 Add unit/property contracts for property/class/task/journal semantics; verify with `pnpm exec vitest run tests/unit/properties.test.ts tests/unit/tasks.test.ts tests/unit/journals.test.ts`.

## 2. Domain implementation

- [x] 2.1 Implement typed property schema, assignments and class inheritance; verify focused property tests.
- [x] 2.2 Implement typed tasks and canonical journals; verify focused task/journal tests.

## 3. Verification

- [x] 3.1 Add parity fixtures and provenance documentation; verify with `pnpm test:parity`.
- [x] 3.2 Run `pnpm verify`, Phase 04 BDD, property/parity suites and strict OpenSpec validation before archive.
