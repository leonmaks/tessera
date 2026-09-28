# Proposal

## Why

Tessera has a roadmap, OpenSpec changes and architecture checks, but they do not yet form a mechanically enforced phase checkpoint. An agent can currently move from a green local test run to the next change without a frozen scope, independent review, or machine-verifiable pre/post conditions.

## What Changes

- Add a repository-wide phase control contract for all 13 implementation phases.
- Require an explicit OpenSpec change, exact implementation scope, previous-gate status and disabled next-phase transition before implementation.
- Require independent read-only PRE and POST gate reports with artifact fingerprints; the implementing model cannot approve its own gate.
- Add an executable gate that checks phase state, scope metadata, review evidence, model escalation policy and repository control files.
- Add BDD/TDD, parity, full verification and architecture-gate evidence requirements to the phase lifecycle.
- Add stop conditions for failed tests, validation, parity, architecture checks, review, scope drift and repeated patch loops.
- Add model-role recommendations for each phase and require escalation for persistence, distributed, security, compatibility and release decisions.

## Capabilities

### New Capabilities

- `phase-quality-gates`: machine-enforced lifecycle, preconditions, postconditions, independent review and model-escalation rules for all implementation phases.

### Modified Capabilities

- None. This is a repository process and verification capability; it does not change product runtime behavior.

## Impact

The change affects `AGENTS.md`, phase-control documentation, OpenSpec process artifacts, package scripts, CI, and a new Node-based executable gate with Vitest coverage. It must not grant any new graph write path or alter domain behavior. No persistence migration is required. Rollback consists of reverting the process files and removing the gate invocation from CI/scripts; product data is untouched.
