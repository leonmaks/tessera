# Design

## Context

The repository already has `AGENTS.md`, the 00–13 roadmap, OpenSpec changes, focused tests, `pnpm verify`, boundary checks and a pinned upstream baseline. These controls are currently documented independently. This change connects them into an explicit state machine without moving graph authority or adding a runtime dependency.

## Goals / Non-Goals

**Goals:**

- Make preconditions and postconditions machine-readable.
- Detect unauthorized changed files, missing review evidence and stale planning fingerprints.
- Make model selection and escalation visible at every phase checkpoint.
- Keep the implementing agent from approving its own work.
- Preserve a clean handoff between numbered phases.

**Non-Goals:**

- The gate does not implement product behavior or replace Vitest, Cucumber, Playwright, parity tests, OpenSpec or boundary checks.
- The gate does not infer semantic correctness from task checkboxes.
- The gate does not archive or commit changes automatically.
- The gate does not treat the existence of `.reference` or a test double as upstream parity.

## Decisions

### Machine-readable control record

`docs/phase-control/CURRENT_PHASE.md` stores a small key/value state record. It names the active change, phase, status, baseline, implementation model, test/fix model, independent review model, required gates and whether the next phase is allowed. The initial repository state is `HANDOFF_REQUIRED`: the gate can audit the contract, but no implementation is authorized until a future change supplies PRE evidence.

### Executable gate

`scripts/phase-quality-gate.mjs` is a dependency-free Node ESM executable. It supports `--audit`, `--pre` and `--post`, emits exactly one `GATE_STATUS: PASS|FAIL`, and never mutates the repository. It validates control fields, OpenSpec change existence, phase range, model policy, review report fingerprints, required evidence and changed-file scope when an approved baseline is present.

The gate treats `HANDOFF_REQUIRED` as a safe idle state for the current repository. It does not authorize implementation. `--pre` and `--post` fail until their respective independent review evidence exists.

### Review evidence

Review reports live under the active OpenSpec change in `evidence/pre-implementation-gate.json` and `evidence/post-implementation-gate.json`. They contain the phase, change, reviewer context, reviewer model, implementation model, status, preconditions, reviewed artifact hashes and blockers. POST reports additionally require actual verification results, parity PASS and postconditions. Hashes are checked against the current files; a changed planning/control artifact invalidates the approval.

### Model policy

The standalone `docs/workflow-models.md` playbook is the human-readable source for role assignments, the 13-phase matrix, workflow steps, pre/post conditions and the handoff prompt. It recommends GLM-5.3-Flash-262k for bounded documentation/test work, Qwen3.8-Flash-Next-262k for parser/UI/BDD/property work, and DeepSeek-V4-Flash-0731-262k for worker/runtime/parity integration. Stronger review is mandatory for migrations, distributed protocols, security, public compatibility, upstream conflicts and release/archive decisions. Model names are recorded as evidence; the script cannot pretend that a different model performed the review.

### Scope and dependency direction

The existing `check:boundaries` remains the source of truth for TypeScript dependency direction. The new gate adds phase scope and process-state checks around it. Product writes continue through graph-worker semantic commands. The gate itself reads Git/OpenSpec metadata only and has no graph access.

## Risks / Trade-offs

- [Risk] Existing worktree changes predate the control record and cannot be safely attributed to one phase. → Start the next implementation only after an explicit clean baseline checkpoint; the initial state is handoff-only and does not claim authorization.
- [Risk] A report could claim PASS without honest independent review. → Require fresh-read-only context, different reviewer identity/model and artifact hashes; the gate validates structure and identity but cannot prove human honesty.
- [Risk] The gate could become a second test framework. → It only validates required evidence and delegates execution to the commands named by OpenSpec/tasks.
- [Risk] Process files can drift from the gate. → `pnpm check:phase-gate` validates the control contract and is included in `pnpm verify` and CI.

## Migration Plan

1. Add the process documents, control record and executable audit mode.
2. Add contract tests for PASS/FAIL cases and wire `check:phase-gate` into verification.
3. For the next product phase, create/update its OpenSpec change, record exact scope and obtain PRE PASS before production edits.
4. Run focused tests, parity and full verification, then OpenSpec Verify and independent POST PASS.
5. Archive only after the gate passes; perform a separate transition checkpoint before enabling the next phase.

Rollback removes the phase-gate invocation and process files; it does not touch graph databases or product data. A rollback does not authorize skipping the original AGENTS/OpenSpec workflow for product changes.
