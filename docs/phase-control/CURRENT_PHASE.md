# Tessera Phase Control

# This repository is currently locked for handoff. No product implementation is
# authorized until a future active change records an independent PRE PASS.
ACTIVE_CHANGE: phase-quality-gates
ACTIVE_PHASE: CONTROL
PHASE_STATUS: HANDOFF_REQUIRED
BASE_COMMIT: NOT_SET
IMPLEMENTATION_MODEL: DeepSeek-V4-Flash-0731-262k
TEST_FIX_MODEL: GLM-5.3-Flash-262k
REVIEW_MODEL: STRONGER_EXTERNAL_REVIEW_REQUIRED
PRE_IMPLEMENTATION_GATE: REQUIRED
POST_IMPLEMENTATION_GATE: REQUIRED
NEXT_PHASE_ALLOWED: false
ARCHIVE_ALLOWED: false
MODEL_SWITCH_POLICY: escalate migrations, distributed protocols, security, public compatibility, upstream conflicts and release decisions

IMPLEMENTATION_SCOPE:
- scripts/phase-quality-gate.mjs
- tests/unit/phase-quality-gate.test.ts
- tests/bdd/features/phase-quality-gates.feature
- tests/bdd/steps/phase-quality-gates.steps.ts

PROCESS_CONTROL_SCOPE:
- AGENTS.md
- docs/PHASE-QUALITY-GATES.md
- docs/workflow-models.md
- docs/phase-control/CURRENT_PHASE.md
- openspec/changes/phase-quality-gates/**
- package.json
- .github/workflows/ci.yml
