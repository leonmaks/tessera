## Context

See proposal.md for motivation. The strict validator reports only editorial warnings in three existing main specifications. Their requirements and scenarios already describe the intended contracts; no product behavior, mutation route, persistence format, authority boundary, or dependency direction changes.

## Goals / Non-Goals

**Goals:** Make all existing OpenSpec documents pass strict structural validation while preserving their semantic content and maintaining the Electron change's global validation gate.

**Non-Goals:** Changing requirements, scenarios, source code, tests, upstream mapping, compatibility evidence, migrations, or archive status.

## Decisions

- Expand only each affected `## Purpose` paragraph to satisfy the validator's minimum documentation threshold. This preserves all normative text and observable behavior.
- Replace the non-normative “may define” wording for the existing class property requirement with equivalent RFC 2119 wording: a class that defines properties SHALL contribute those definitions to tagged nodes. The corresponding scenario already expresses this outcome.
- Use `skip_specs: true` for this change: editing validator-facing prose in main specs is not a new or modified product capability. A delta specification would incorrectly imply behavior changed.
- Verify first with the focused strict validator and then with the full global strict validator. No BDD, property, parity, or runtime tests are changed because no runtime contract changes.

## Risks / Trade-offs

- [Editorial edit accidentally alters a contract] → compare requirement/scenario structure before and after, and restrict the patch to the stated warnings.
- [Global validation finds a new unrelated issue] → report it without expanding this narrowly scoped cleanup.

## Migration Plan

No deployment, graph, protocol, or data migration exists. Rollback is a textual reversion of the three documentation edits.
