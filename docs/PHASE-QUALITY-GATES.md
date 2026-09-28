# Tessera Phase Quality Gates

The model assignment and step-by-step delegation rules are maintained in the standalone [workflow-models.md](workflow-models.md) playbook. This document defines the five defenses and their machine-enforced phase contract.

Every one of the 13 roadmap phases is a separate engineering checkpoint. A phase may be implemented only through one named OpenSpec change and may advance through this lifecycle:

```text
PLAN
  ↓
OpenSpec validate
  ↓
independent PRE gate
  ↓
BDD / failing TDD / property tests
  ↓
implementation inside frozen scope
  ↓
focused tests → parity → pnpm verify
  ↓
machine architecture gate
  ↓
OpenSpec Verify
  ↓
independent POST gate
  ↓
archive
  ↓
separate handoff to the next phase
```

Any required FAIL is a hard stop. A green unit suite does not override a failed OpenSpec validation, parity result, architecture gate, evidence check or independent review.

## Five lines of defense

1. **OpenSpec** defines the allowed behavior, scope, scenarios, dependencies and exit criteria. Production work outside the active change is forbidden.
2. **`AGENTS.md`** defines implementation constraints: graph-worker authority, dependency direction, typed boundaries, clean-room upstream use, regression-first fixes and stop conditions.
3. **BDD/TDD/property/parity tests** define observable behavior, invariants, regression fixtures and candidate-versus-upstream evidence.
4. **Executable gates** run `check:specs`, `check:boundaries`, `typecheck`, required tests, scope checks and evidence checks. The gate emits exactly one final `GATE_STATUS: PASS|FAIL`.
5. **Independent gate review** is a fresh read-only review after planning and after implementation. The implementing model cannot issue its own PASS. Review reports are fingerprinted against the reviewed artifacts.

## Phase matrix

| Phase | Capability | Primary worker | Test/fix worker | Independent review | Escalate when |
|---:|---|---|---|---|---|
| 00 | Repository/parity harness | Qwen3.8-Flash-Next-262k | GLM-5.3-Flash-262k | DeepSeek-V4-Flash-0731-262k | baseline/provenance conflict |
| 01 | Graph model/transactions | DeepSeek-V4-Flash-0731-262k | GLM-5.3-Flash-262k | Stronger external model | migrations, recovery, identity |
| 02 | Outliner | DeepSeek-V4-Flash-0731-262k | Qwen3.8-Flash-Next-262k | DeepSeek | structural invariant conflict |
| 03 | Parser/references | Qwen3.8-Flash-Next-262k | GLM-5.3-Flash-262k | DeepSeek | upstream syntax conflict |
| 04 | Properties/tasks/journals | DeepSeek-V4-Flash-0731-262k | Qwen3.8-Flash-Next-262k | Stronger external model | schema or DB/file-graph conflict |
| 05 | Query engine | DeepSeek-V4-Flash-0731-262k | Qwen3.8-Flash-Next-262k | Stronger external model | Datalog compatibility or resource safety |
| 06 | Worker/RPC/subscriptions | DeepSeek-V4-Flash-0731-262k | GLM/Qwen | Stronger external model | authority or duplicate publication |
| 07 | React editor/UI | Qwen3.8-Flash-Next-262k | GLM-5.3-Flash-262k | DeepSeek | renderer/worker boundary conflict |
| 08 | Import/export/assets | DeepSeek-V4-Flash-0731-262k | Qwen3.8-Flash-Next-262k | Stronger external model | rollback or round-trip mismatch |
| 09 | Search/graph projection | DeepSeek-V4-Flash-0731-262k | Qwen3.8-Flash-Next-262k | DeepSeek | index authority or ranking contract |
| 10 | Plugin compatibility | DeepSeek-V4-Flash-0731-262k | Qwen3.8-Flash-Next-262k | Stronger external model | public facade or raw-write risk |
| 11 | Desktop/CLI runtime | DeepSeek-V4-Flash-0731-262k | GLM/Qwen | Stronger external model | lock, backup, process recovery |
| 12 | RTC/sync | DeepSeek-V4-Flash-0731-262k | GLM-5.3-Flash-262k | Stronger external model | convergence, ordering, rebase |
| 13 | Remote API/hardening | DeepSeek-V4-Flash-0731-262k | Qwen3.8-Flash-Next-262k | Stronger external model | auth, E2EE, limits, public contract |

The model matrix is a recommendation, not evidence of correctness. The selected implementation and reviewer identities must be recorded in the phase evidence. If the selected model is below the declared level, the machine gate reports `MODEL_SWITCH_REQUIRED` and the phase cannot advance.

## Machine control record

`docs/phase-control/CURRENT_PHASE.md` is a small key/value state record. It is intentionally initialized as `HANDOFF_REQUIRED`; this repository is not allowed to claim a new phase implementation until a phase-specific PRE report exists.

The required state fields are:

```text
ACTIVE_CHANGE
ACTIVE_PHASE
PHASE_STATUS
BASE_COMMIT
IMPLEMENTATION_MODEL
TEST_FIX_MODEL
REVIEW_MODEL
PRE_IMPLEMENTATION_GATE
POST_IMPLEMENTATION_GATE
NEXT_PHASE_ALLOWED
```

For an implementation phase, the record also contains `IMPLEMENTATION_SCOPE` and `PROCESS_CONTROL_SCOPE` sections. The baseline commit is frozen before production edits. The gate considers the union of committed, staged, worktree and untracked changes so a change cannot hide scope drift in another Git layer.

## Review reports

The active change stores:

```text
openspec/changes/<change>/evidence/pre-implementation-gate.json
openspec/changes/<change>/evidence/post-implementation-gate.json
```

Each report must include `gateStatus`, `reviewerContext: "fresh-read-only"`, `reviewerModel`, `implementationModel`, `changeName`, `phase`, `reviewedArtifacts`, `reviewSession` and a non-empty `preconditions` list. The machine gate recomputes every listed SHA-256 fingerprint. A stale report is FAIL.

POST evidence additionally records the actual verification commands and statuses, OpenSpec Verify result, machine gate result, `parity: "PASS"`, a non-empty `postconditions` list and archive eligibility. `compatible: false` or `test-double` evidence cannot be relabeled as upstream execution.

## Stop and repair rules

- Stop immediately on any required test, typecheck, spec validation, boundary, parity, OpenSpec Verify or gate failure.
- After two unsuccessful fixes of the same deterministic defect, stop patching and classify the root cause as domain model, invariant, algorithm, boundary, state transition, test, spec conflict, integration or environment.
- A failed review requires repair in the active change and a fresh review. Editing the review report to turn FAIL into PASS is forbidden.
- A scope conflict requires planning repair and a new PRE review; moving the baseline to hide a file is forbidden.
- Previous phases are read-only dependencies unless the active change explicitly authorizes a repair and the PRE gate covers it.
- A phase is not complete because code compiles. It is complete only after its roadmap exit criteria, parity evidence, POST review and archive checks pass.

## Commands

```powershell
pnpm check:phase-gate
pnpm phase:pre
pnpm phase:post
pnpm verify
pnpm exec openspec validate --all --strict
```

`check:phase-gate` is the safe audit. `phase:pre` and `phase:post` are transition gates and must be run only for the active OpenSpec change after the corresponding evidence has been independently produced.
