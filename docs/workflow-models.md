# Tessera Workflow Models

This document is the model and workflow playbook for the 13 Tessera roadmap phases. It defines which model class performs each role, when the model must be changed, and which evidence is required before the next checkpoint.

The authority order is:

1. `AGENTS.md` and scoped `AGENTS.md` files define implementation prohibitions.
2. The active OpenSpec change defines the allowed behavior, scope and exit criteria.
3. `docs/phase-control/CURRENT_PHASE.md` defines the current state, baseline and selected models.
4. This document defines the recommended division of work between models.
5. `scripts/phase-quality-gate.mjs` decides whether the recorded state is structurally admissible.

The model recommendation never replaces tests, OpenSpec validation, architecture checks, parity evidence or independent review.

## Model roles

| Model | Primary role | Suitable work | Escalate instead when |
|---|---|---|---|
| GLM-5.3-Flash-262k | Test/fix and bounded documentation worker | deterministic fixtures, focused regression tests, test diagnosis with a clear contract, documentation and small mechanical repairs | the change affects architecture, schema, public compatibility, distributed behavior or unresolved upstream semantics |
| Qwen3.8-Flash-Next-262k | Parser/UI/BDD/property worker | parsing, references, editor behavior, BDD scenarios, property tests and structured test plans | the task changes graph authority, transactions, persistence, sync or a public protocol |
| DeepSeek-V4-Flash-0731-262k | Implementation and integration worker | graph transactions, worker/runtime integration, parity harnesses, cross-package behavior and complex repairs | migrations, recovery, distributed protocols, security, public compatibility or an unresolved contract conflict |
| Stronger external reviewer | Independent architecture and release reviewer | schema migration, rollback/recovery, sync convergence, auth/security, public API compatibility, upstream conflicts and final archive/release decisions | never downgrade to a routine worker for the listed escalation cases |

The implementation model, test/fix model and reviewer model are recorded separately. The reviewer must use a fresh read-only context and must not be the implementation model. A model may perform more than one role only when the gate still has a distinct independent reviewer.

## Phase matrix

| Phase | Capability | Implementation | Test/fix | Independent review | Mandatory escalation |
|---:|---|---|---|---|---|
| 00 | Repository/parity harness | Qwen3.8-Flash-Next-262k | GLM-5.3-Flash-262k | DeepSeek-V4-Flash-0731-262k | baseline or provenance conflict |
| 01 | Graph model/transactions | DeepSeek-V4-Flash-0731-262k | GLM-5.3-Flash-262k | Stronger external model | migrations, recovery or identity conflict |
| 02 | Outliner | DeepSeek-V4-Flash-0731-262k | Qwen3.8-Flash-Next-262k | DeepSeek-V4-Flash-0731-262k | tree, UUID or ordering invariant conflict |
| 03 | Parser/references | Qwen3.8-Flash-Next-262k | GLM-5.3-Flash-262k | DeepSeek-V4-Flash-0731-262k | upstream syntax conflict |
| 04 | Properties/tasks/journals | DeepSeek-V4-Flash-0731-262k | Qwen3.8-Flash-Next-262k | Stronger external model | schema or DB/file-graph conflict |
| 05 | Query engine | DeepSeek-V4-Flash-0731-262k | Qwen3.8-Flash-Next-262k | Stronger external model | Datalog compatibility or resource-safety conflict |
| 06 | Worker/RPC/subscriptions | DeepSeek-V4-Flash-0731-262k | Qwen3.8-Flash-Next-262k | Stronger external model | authority or duplicate-publication conflict |
| 07 | React editor/UI | Qwen3.8-Flash-Next-262k | GLM-5.3-Flash-262k | DeepSeek-V4-Flash-0731-262k | renderer/worker boundary conflict |
| 08 | Import/export/assets | DeepSeek-V4-Flash-0731-262k | Qwen3.8-Flash-Next-262k | Stronger external model | rollback or round-trip mismatch |
| 09 | Search/graph projection | DeepSeek-V4-Flash-0731-262k | Qwen3.8-Flash-Next-262k | DeepSeek-V4-Flash-0731-262k | index authority or ranking contract conflict |
| 10 | Plugin compatibility | DeepSeek-V4-Flash-0731-262k | Qwen3.8-Flash-Next-262k | Stronger external model | public facade or raw-write risk |
| 11 | Desktop/CLI runtime | DeepSeek-V4-Flash-0731-262k | Qwen3.8-Flash-Next-262k | Stronger external model | lock, backup or process-recovery conflict |
| 12 | RTC/sync | DeepSeek-V4-Flash-0731-262k | GLM-5.3-Flash-262k | Stronger external model | convergence, ordering or rebase conflict |
| 13 | Remote API/hardening | DeepSeek-V4-Flash-0731-262k | Qwen3.8-Flash-Next-262k | Stronger external model | authentication, E2EE, limits or public contract |

If the current task enters the mandatory escalation column, the stronger reviewer is required even when the phase table names a routine reviewer. The implementation must stop until the selected model is recorded and the PRE gate is renewed.

## Workflow for every change

The active change is always one exact OpenSpec change. Replace `<change>` with `ACTIVE_CHANGE` from `docs/phase-control/CURRENT_PHASE.md`.

| Step | Action | Model role | Preconditions | Required result |
|---:|---|---|---|---|
| 1 | Bootstrap: read the roadmap, relevant specs, baseline and current control record | implementation model | repository state and phase are known | one permitted change and one permitted scope are selected |
| 2 | Create or update proposal, specs, design and tasks | implementation model; stronger model for complex architecture | no production edits | coherent OpenSpec planning package |
| 3 | Validate planning artifacts and control fields | implementation model | proposal, specs, design and tasks exist | strict OpenSpec validation passes |
| 4 | Perform fresh independent PRE review | independent reviewer | frozen planning fingerprints are available | `PRE PASS`; implementation is authorized for the recorded scope |
| 5 | Freeze baseline and exact paths | implementation model | PRE PASS | `BASE_COMMIT`, implementation scope and process scope are recorded |
| 6 | Write BDD, failing TDD, property and parity tests | test/fix model | PRE PASS and frozen scope | every required observable behavior has an executable check |
| 7 | Implement the smallest production change | implementation model | failing tests and OpenSpec scope exist | code stays within the approved scope |
| 8 | Run focused checks, parity, boundaries, typecheck and full verification | test/fix model for repairs | implementation tasks are complete | all required commands pass; no evidence is relabeled |
| 9 | Run OpenSpec Verify and machine gate | implementation model | implementation is frozen for verification | no unresolved correctness or evidence blocker |
| 10 | Perform fresh independent POST review | independent reviewer | OpenSpec Verify and machine gate pass | `POST PASS`, complete evidence and archive eligibility |
| 11 | Archive and close the change | stronger reviewer for release-sensitive work | POST PASS | change is archived; next phase remains disabled |
| 12 | Create a separate handoff checkpoint | independent reviewer | previous change is closed | next phase gets its own OpenSpec PRE cycle |

The machine gate supports these checks directly:

```powershell
pnpm check:phase-gate
pnpm phase:pre
pnpm phase:post
pnpm verify
pnpm exec openspec validate --all --strict
```

`check:phase-gate` is a read-only audit. `phase:pre` and `phase:post` must fail when the control record is still `HANDOFF_REQUIRED`, when evidence is missing, when fingerprints are stale, when the reviewer self-approves, when a model is below the phase requirement, or when files changed outside the approved scope.

## Preconditions and postconditions

Every PRE report records non-empty `preconditions`, including the selected change, phase, baseline, scope, model roles, BDD/TDD plan and independent-review context. Every POST report records non-empty `postconditions`, actual verification command results, `parity: "PASS"`, `openSpecVerify: "PASS"`, `machineGate: "PASS"` and `archiveAllowed: true`.

The gate recomputes SHA-256 fingerprints for reviewed artifacts. Changing a proposal, spec, design, task file, control record or other reviewed artifact invalidates the corresponding review and requires a fresh review.

## Model-switch rules

Switch models before continuing when:

- the gate emits `MODEL_SWITCH_REQUIRED`;
- a migration, rollback or recovery path is introduced;
- a distributed transaction, sync, rebase or convergence rule changes;
- authentication, encryption, rate limits or another security boundary changes;
- a public RPC, plugin, CLI or remote API contract changes;
- upstream executable evidence conflicts with the current interpretation;
- the change affects release, archive or transition authorization.

The switch is recorded in the control record and OpenSpec evidence. The affected PRE or POST review is repeated; changing the model does not preserve an earlier approval automatically.

## Stop conditions

Stop phase progression on any failed test, parity run, boundary check, typecheck, OpenSpec validation, machine gate or independent review. After two unsuccessful repairs of the same deterministic defect, stop the patch loop and classify the root cause before editing production code again. Never move `BASE_COMMIT`, weaken an assertion, change a seed or edit evidence solely to obtain PASS.

The next phase never starts automatically. A green POST closes only the current change; the next phase requires its own planning package, model selection, PRE review and frozen baseline.

## Handoff prompt

Use this prompt when assigning work to another model:

> Read `AGENTS.md`, `docs/IMPLEMENTATION-ROADMAP.md`, the relevant OpenSpec specs, `upstream/baseline.json`, `docs/workflow-models.md` and `docs/phase-control/CURRENT_PHASE.md`. Identify the exact active change and allowed scope. Perform only the assigned workflow step. Report preconditions, commands, evidence and postconditions. Stop on any gate failure, scope conflict or required model escalation. Do not start the next phase automatically.
