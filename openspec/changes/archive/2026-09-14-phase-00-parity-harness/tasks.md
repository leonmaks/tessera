## 1. Behavioral tests

- [x] 1.1 Add executable Phase 00 BDD scenarios and regression fixtures before production code; verify with `pnpm test:bdd --tags @phase00`.
- [x] 1.2 Observe failing harness, deterministic-port and architecture contract tests; run `pnpm test -- tests/parity/harness.test.ts tests/unit`.

## 2. Implementation

- [x] 2.1 Implement sequence ports and validated conservative provider comparison; verify with `pnpm test -- tests/parity/harness.test.ts tests/unit/platform.test.ts`.
- [x] 2.2 Implement import-aware architecture checker; verify with `pnpm test -- tests/unit/boundaries.test.ts` and `pnpm check:boundaries`.

## 3. Verification and evidence

- [x] 3.1 Record harness evidence and known limits; run `pnpm test:parity` and `pnpm test:bdd --tags @phase00`.
- [x] 3.2 Run Phase 00 exit commands and `pnpm verify`; validate change with `pnpm exec openspec validate phase-00-parity-harness --strict`.
- [x] 3.3 Sync/archive only after evidence and fixtures are committed; verified commit `c8106b2`, ran inline `openspec-sync-specs`, validated with `pnpm exec openspec validate --specs`, and moved the change using the archive skill after confirming all delta requirements were present.
