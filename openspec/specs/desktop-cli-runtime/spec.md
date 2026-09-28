# desktop-cli-runtime Specification

## Purpose
Provide a local, graph-bound desktop and CLI control plane that preserves single-writer ownership and exposes only semantic graph operations.

## Requirements

### Requirement: Graph daemon lifecycle is exclusive and recoverable
The local runtime SHALL lock one graph to one live writer, report health, recover stale lock ownership, and permit orderly shutdown.

#### Scenario: Concurrent startup
- **GIVEN** a healthy daemon owns a graph
- **WHEN** another local client starts it
- **THEN** it SHALL reuse the healthy daemon and SHALL NOT create another writer

#### Scenario: Stale owner
- **GIVEN** a lock references an unhealthy daemon
- **WHEN** a local client starts the graph
- **THEN** it SHALL replace the stale ownership safely

### Requirement: Local routes use semantic operations
The daemon SHALL expose health, invoke, events and shutdown routes and SHALL reject raw graph datom mutations.

#### Scenario: Semantic invoke
- **WHEN** a client invokes a supported semantic command
- **THEN** the daemon SHALL delegate it through the graph command port

### Requirement: Backup is SQLite-consistent
The daemon SHALL create a backup through an injected SQLite-consistent snapshot capability.

#### Scenario: Backup restore
- **WHEN** a live graph backup is requested
- **THEN** the snapshot capability SHALL produce a restorable graph backup
