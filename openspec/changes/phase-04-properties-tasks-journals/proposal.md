## Why

The graph can persist primitive facts but has no typed property schema, class inheritance, task state, or canonical journals. Phase 04 makes these user-visible concepts semantic graph data rather than editor-text conventions.

## What Changes

- Implement typed property definitions, cardinality, value validation and effective class/tag properties.
- Implement class inheritance DAG checks and inheritance resolution.
- Add typed task state, deterministic status cycling, atomic daily repetition, and date-canonical journals.
- Add BDD, property tests, and declared-provenance parity fixtures.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `properties-classes`: expose typed schema, cardinality and DAG behavior.
- `tasks-journals`: expose typed task lifecycle and canonical journal identity.

## Impact

Changes affect L3 domain services only; the services remain pure in-memory semantic models ready for a later graph-worker persistence adapter. No SQLite migration is made. Pinned upstream execution is not currently available, so fixtures will explicitly use test-double provenance and cannot claim L3 compatibility.
