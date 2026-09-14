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

### Requirement: Desktop SQLite is source of truth
Desktop primary persistence SHALL be filesystem SQLite for the graph runtime.

### Requirement: Backups use SQLite-consistent snapshot
A backup of a live graph SHALL use SQLite backup/snapshot semantics and SHALL NOT be a naive copy of the live DB file.

### Requirement: Search/client-op databases are rebuildable
Auxiliary indexes SHALL NOT be treated as authoritative graph backup content.
