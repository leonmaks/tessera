## MODIFIED Requirements

### Requirement: One active local writer per graph
Desktop/CLI runtime SHALL prevent two active writer daemons from owning the same graph and SHALL recover a stale owner only after its health check fails.

#### Scenario: Second writer attempts startup
- **GIVEN** a healthy daemon owns graph G
- **WHEN** another process requests G
- **THEN** it SHALL connect/reuse the owned runtime or fail safely
- **AND** SHALL NOT start a second writer

#### Scenario: Stale daemon recovery
- **GIVEN** persisted ownership points to an unhealthy daemon
- **WHEN** a new daemon requests graph G
- **THEN** it SHALL replace the stale owner before accepting mutations

### Requirement: Backups use SQLite-consistent snapshot
A backup of a live graph SHALL use SQLite backup/snapshot semantics and SHALL NOT be a naive copy of the live DB file.

#### Scenario: Live graph backup
- **GIVEN** a live SQLite graph
- **WHEN** a backup is requested
- **THEN** the backup SHALL use SQLite-consistent backup or snapshot semantics
