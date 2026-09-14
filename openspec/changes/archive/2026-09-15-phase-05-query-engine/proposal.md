## Why

The repository has graph data but no compatible public query surface. Phase 05 adds a bounded, deterministic Datalog/simple-query engine so callers do not substitute ad-hoc filtering for the compatibility contract.

## What Changes

- Add runtime-validated Datalog core clauses, joins, pull projection and logical clause support.
- Add simple task query compilation, predicates/aggregates/rules in the explicitly tested subset, and resource limits.
- Add BDD, unit/property and parity corpus with documented deterministic ordering.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `query-engine`: define deterministic ordering and bounded evaluation behavior.

## Impact

This is L4 pure query-domain work; no persistence migration or raw graph write API is introduced. Pinned upstream query execution is unavailable, so test-double parity remains non-compatible evidence.
