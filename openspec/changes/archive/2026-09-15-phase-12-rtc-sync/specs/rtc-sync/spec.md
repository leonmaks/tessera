## Purpose

Provide ordered synchronization of semantic graph operations with convergence diagnostics and ephemeral presence.

## ADDED Requirements

### Requirement: Sync batches are ordered and recover stale clients
The sync service SHALL assign monotonic positions, reject stale batches, and permit clients to pull and retry semantic operations.

#### Scenario: Stale retry
- **GIVEN** a stale client batch
- **WHEN** the server rejects it with its current position
- **THEN** the client SHALL pull before retrying the batch

### Requirement: Presence is ephemeral
Presence SHALL be delivered separately from durable transaction batches.

#### Scenario: Presence delivery
- **WHEN** a participant updates presence
- **THEN** no durable graph transaction SHALL be created
