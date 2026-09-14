## ADDED Requirements

### Requirement: Graph schema migrations are versioned and atomic
The authoritative graph store SHALL record its schema version and apply pending migrations in order within a recoverable database transaction. A failed migration SHALL leave the last successful schema version and data available on the next open.

#### Scenario: Failed migration recovery
- **GIVEN** graph G is at schema version V
- **WHEN** migration V+1 fails before commit
- **THEN** reopening G SHALL report schema version V
- **AND** facts committed before the migration SHALL remain readable

### Requirement: Committed state recovers after reopen
On reopening an authoritative graph store, all committed transactions SHALL be readable at the latest committed revision and incomplete transactions SHALL not be visible.

#### Scenario: Reopen after interrupted transaction
- **GIVEN** transaction T is interrupted before its database commit
- **WHEN** the graph store is reopened
- **THEN** T's facts SHALL not be visible
- **AND** the latest visible revision SHALL be the revision before T
