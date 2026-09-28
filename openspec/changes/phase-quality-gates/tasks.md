# Tasks

## 1. Contract and documentation

- [x] 1.1 Add the phase-quality-gates OpenSpec delta with Given/When/Then scenarios for scope, PRE/POST review, evidence, architecture bypass and model escalation; verify with `pnpm exec openspec validate phase-quality-gates --strict`.
- [x] 1.2 Add the Tessera phase quality-gate playbook, 13-phase model matrix, preconditions, postconditions, stop conditions and handoff rules; verify every command in the playbook is present in `package.json` or documented as an explicit external review action.
- [x] 1.3 Extend `AGENTS.md` with the five-line defense contract, no-patch-loop rule, independent review rule, model escalation and no phase advancement; verify with `pnpm check:phase-gate`.

## 2. Executable gate

- [x] 2.1 Add machine-readable `docs/phase-control/CURRENT_PHASE.md` and validate phase, change, baseline, model and transition fields; verify with `pnpm check:phase-gate`.
- [x] 2.2 Implement read-only `scripts/phase-quality-gate.mjs` with `--audit`, `--pre` and `--post`, exact scope checks, review fingerprints and one `GATE_STATUS` result; verify with `pnpm test -- tests/unit/phase-quality-gate.test.ts`.
- [x] 2.3 Add independent-review evidence validation requiring fresh-read-only context, reviewer/implementer separation and stronger-review escalation; verify with `pnpm test -- tests/unit/phase-quality-gate.test.ts`.

## 3. Verification integration

- [x] 3.1 Add BDD/TDD contract coverage for safe idle, missing PRE, stale fingerprints, missing evidence, self-approval and successful POST; verify with `pnpm test -- tests/unit/phase-quality-gate.test.ts` and `pnpm test:bdd -- --tags @phase-quality-gates`.
- [x] 3.2 Wire the audit gate into `pnpm verify` and CI while preserving the current handoff-only baseline; verify with `pnpm verify` and the CI command list.
- [x] 3.3 Run strict OpenSpec validation, boundaries, typecheck and the complete regression suite; verify with `pnpm exec openspec validate --all --strict`, `pnpm check:boundaries`, `pnpm typecheck` and `pnpm test`.

## 4. Handoff checkpoint

- [x] 4.1 Record the initial repository handoff state and explicitly document that it authorizes no product implementation until a phase-specific PRE PASS exists; verify with `pnpm check:phase-gate -- --audit`.
- [ ] 4.2 Perform an independent POST review of this process change and archive it only after OpenSpec Verify, machine PASS and review PASS; verify with `pnpm exec openspec status --change phase-quality-gates --json` and `pnpm exec openspec validate --all --strict`.
