## 1. Behavioral red tests

- [x] 1.1 Extend `tests/bdd/features/outliner.feature` and add step definitions for insert, cross-page move, cycles, indent/outdent, split/merge, deletion and undo; verify red with `pnpm test:bdd --tags @phase-02`.
- [x] 1.2 Add focused outliner unit contracts plus randomized structural-command invariants; verify red with `pnpm test -- tests/unit/outliner.test.ts` and `pnpm test:property`.

## 2. Authoritative structural storage

- [x] 2.1 Add validated cardinality-one fact replacement and read-only entity enumeration to the graph database; verify with `pnpm test -- tests/unit/transaction-engine.test.ts tests/unit/outliner.test.ts`.
- [x] 2.2 Implement the semantic outliner service over the graph port, including atomic structural commands, snapshot reads, selection canonicalization, and undo/redo; verify with `pnpm test -- tests/unit/outliner.test.ts`.

## 3. Compatibility evidence and verification

- [x] 3.1 Extend the validated parity scenario schema, add fixtures for every structural command, and add candidate/reference report tests; record the pinned-upstream limitation in `docs/source-map.md` and `docs/COMPATIBILITY-MATRIX.md`; verify with `pnpm test:parity`.
- [x] 3.2 Run Phase 02 BDD, property suite, `pnpm verify`, `pnpm test:parity`, and `pnpm exec openspec validate phase-02-outliner-core --strict`; verify all commands pass before archiving.
