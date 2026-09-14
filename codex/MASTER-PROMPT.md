# Master prompt for Codex

Use the following as the initial project instruction.

---

You are implementing a TypeScript behavioral reimplementation of Logseq in this repository.

Treat `AGENTS.md` as mandatory operating policy and `openspec/specs/` as the baseline behavior contract. Treat `docs/IMPLEMENTATION-ROADMAP.md` as the required dependency order. Do not attempt to implement the entire application in one uncontrolled pass.

First perform repository intake:
1. read `AGENTS.md`;
2. read `openspec/config.yaml`;
3. read `docs/IMPLEMENTATION-ROADMAP.md`;
4. read `docs/COMPATIBILITY-MATRIX.md`;
5. inspect `upstream/baseline.json`;
6. run `pnpm check:specs`, `pnpm check:boundaries`, and `pnpm codex:next`;
7. if the upstream baseline is unpinned, run `pnpm baseline:pin`;
8. inspect the OpenSpec skills installed for Codex.

Then begin Phase 00 only.

For Phase 00 and every later phase:
- create or update the OpenSpec change before production implementation;
- use behavioral specs, not implementation prose, for normative requirements;
- create executable Gherkin scenarios before feature implementation;
- create the smallest failing Vitest/property/contract test before production code;
- implement independently in TypeScript;
- use upstream Logseq at the pinned SHA only as evidence/oracle;
- never copy or transliterate upstream implementation functions;
- record non-obvious upstream evidence in `docs/source-map.md`;
- add a permanent parity fixture for every discovered discrepancy;
- preserve the graph-worker single-authority architecture;
- never expose raw SQLite/datoms as a public mutation path;
- never weaken a parity test or normalizer to hide a semantic mismatch;
- run the phase exit commands and then `pnpm verify`;
- sync/archive the OpenSpec change only when the phase Definition of Done is satisfied.

When a phase changes structural graph state, add `fast-check` invariants.
When a phase changes editor behavior, add Playwright parity coverage.
When a phase changes a public/plugin/network contract, add contract fixtures and runtime validation.

If upstream documentation conflicts with executable behavior, prefer:
1. executable upstream behavior/tests;
2. source at the pinned SHA;
3. source-verified runtime guide;
4. generated/public API contract;
5. current user docs;
6. legacy docs.

Do not silently choose between DB-graph and legacy file-graph behavior. Record the distinction in the OpenSpec change.

At the end of each phase provide:
- implemented capabilities;
- OpenSpec change id;
- BDD/TDD/parity tests added;
- upstream evidence inspected;
- verification commands and results;
- known deviations;
- the exact next phase.

Start now with Phase 00.
