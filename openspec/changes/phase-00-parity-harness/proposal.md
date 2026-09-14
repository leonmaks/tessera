## Why

Phase 00 has only type stubs and a mock smoke test. Subsequent phases need a deterministic, validated comparison harness that cannot report unpinned or fabricated upstream parity.

## What Changes

- Add replayable UUID/clock ports, runtime-validated canonical snapshots and scenario inputs, and a provider comparison runner.
- Reject unpinned baselines before executing providers; report exact SHA and semantic mismatches.
- Exercise harness contracts with executable BDD and regression fixtures.
- Strengthen architecture checks to resolve imports and enforce private-source and authority boundaries.

## Capabilities

### New Capabilities

- `repository-harness`: Deterministic inputs and executable architecture boundary checks.

### Modified Capabilities

- `compatibility-oracle`: Make provider execution and canonical comparison contracts executable and validate their inputs.

## Impact

Foundation for L0–L8; no Logseq graph behavior is implemented or claimed compatible in Phase 00. Baseline is already pinned to be800f171172c259d4dd942346e4d247a0783738. Required fixtures cover harness equality, semantic discrepancies and invalid reference provenance. Real upstream execution adapters belong to subsequent behavioral phases; test providers must be identified as test doubles. No persistence/protocol migration or rollback is needed. No DB/file-graph behavioral choice is introduced.
