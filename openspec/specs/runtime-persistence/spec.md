# Runtime and Persistence Specification

## Purpose

Define browser/desktop/CLI authority and persistence boundaries.

## Requirements

### Requirement: One active local writer per graph
Desktop/CLI runtime SHALL prevent two active writer daemons from owning the same graph.

#### Scenario: Second writer attempts startup
- **GIVEN** a healthy daemon owns graph G
- **WHEN** another process requests G
- **THEN** it SHALL connect/reuse the owned runtime or fail safely
- **AND** SHALL NOT start a second writer

### Requirement: Browser worker owns browser DB access
Browser renderer SHALL NOT directly own the authoritative SQLite handle.

#### Scenario: Browser database authority
- **GIVEN** a running browser graph
- **WHEN** the renderer requests graph data
- **THEN** the authoritative SQLite handle SHALL remain owned outside the renderer by the worker

### Requirement: Desktop SQLite is source of truth
Desktop primary persistence SHALL be filesystem SQLite for the graph runtime.

#### Scenario: Desktop graph persistence
- **GIVEN** a desktop graph runtime
- **WHEN** graph state is persisted
- **THEN** filesystem SQLite SHALL be its primary persistence

### Requirement: Backups use SQLite-consistent snapshot
A backup of a live graph SHALL use SQLite backup/snapshot semantics and SHALL NOT be a naive copy of the live DB file.

#### Scenario: Live graph backup
- **GIVEN** a live SQLite graph
- **WHEN** a backup is requested
- **THEN** the backup SHALL use SQLite-consistent backup or snapshot semantics

### Requirement: Search/client-op databases are rebuildable
Auxiliary indexes SHALL NOT be treated as authoritative graph backup content.

#### Scenario: Auxiliary store recovery
- **GIVEN** authoritative graph persistence and rebuildable auxiliary indexes
- **WHEN** backup authority is determined
- **THEN** the auxiliary indexes SHALL NOT serve as authoritative graph backup content

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
