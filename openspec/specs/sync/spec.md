# Sync Specification

## Purpose

Define ordered graph synchronization and convergence behavior.

## Requirements

### Requirement: Client writes declare server position
A transaction batch SHALL include the server position (`t-before`) on which it is based.

#### Scenario: Current batch
- **GIVEN** server position is T
- **WHEN** a valid batch declares `t-before = T`
- **THEN** the server MAY apply it and advance the position

### Requirement: Stale batch is rejected
A batch whose `t-before` differs from current server position SHALL be rejected as stale, include the current position, and require client pull/rebase before retry.

#### Scenario: Stale writer
- **GIVEN** server position is 12
- **WHEN** client submits `t-before = 10`
- **THEN** the response SHALL identify the current position
- **AND** the client SHALL pull/rebase before retrying

### Requirement: Presence is ephemeral
Presence/editing indicators SHALL NOT become durable graph transactions.

#### Scenario: Presence update
- **GIVEN** a connected participant
- **WHEN** its presence or editing indicator changes
- **THEN** the change SHALL NOT become a durable graph transaction

### Requirement: Large logical transactions preserve order
Chunking MAY bound request/apply memory, but SHALL preserve logical order and SHALL report partial success explicitly if full rollback is not possible.

#### Scenario: Partially applied chunks
- **GIVEN** a chunked logical transaction whose applied prefix cannot be rolled back
- **WHEN** a later chunk fails
- **THEN** logical order SHALL be preserved and partial success SHALL be reported explicitly

### Requirement: Checksum compares normalized logical state
Checksum diagnostics SHALL be based on stable normalized graph content, not SQLite row order.

#### Scenario: Different physical row order
- **GIVEN** two stores with equal normalized logical content and different SQLite row order
- **WHEN** their diagnostic checksums are computed
- **THEN** the checksums SHALL be equal
