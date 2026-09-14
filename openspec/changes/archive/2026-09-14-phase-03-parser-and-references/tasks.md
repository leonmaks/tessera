## 1. Behavioral red tests

- [x] 1.1 Add `@phase-03` parser/reference Gherkin scenarios for Markdown, Org, code isolation, block identity, aliases and backlinks; verify red with `pnpm test:bdd --tags @phase-03`.
- [x] 1.2 Add golden parser/reference unit contracts and arbitrary-input parser invariants; verify red with `pnpm exec vitest run tests/unit/parser.test.ts tests/unit/references.test.ts tests/property/parser-invariants.test.ts`.

## 2. Semantic parsing and references

- [x] 2.1 Implement the pure Markdown/Org structural and inline parser with frozen AST outputs and code isolation; verify with `pnpm exec vitest run tests/unit/parser.test.ts tests/property/parser-invariants.test.ts`.
- [x] 2.2 Implement AST-based extraction, aliases/namespaces, and immutable backlink projections; verify with `pnpm exec vitest run tests/unit/references.test.ts`.

## 3. Compatibility and phase verification

- [x] 3.1 Add permanent parser/reference parity fixtures and declared-provenance candidate/reference reports; update `docs/source-map.md` and `docs/COMPATIBILITY-MATRIX.md`; verify with `pnpm test:parity`.
- [x] 3.2 Run Phase 03 BDD, property suite, `pnpm verify`, `pnpm test:parity`, and `pnpm exec openspec validate phase-03-parser-and-references --strict`; verify all commands pass before archiving.
