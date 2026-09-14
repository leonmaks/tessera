# Transaction Engine Specification

## Purpose

Define atomic graph mutation, revision and observer semantics.

## Requirements

### Requirement: One authoritative commit
A semantic graph command SHALL produce at most one authoritative committed graph result for an operation.

#### Scenario: Multi-entity move is one operation
- **GIVEN** a move changes parent, order and page membership for a subtree
- **WHEN** the move succeeds
- **THEN** observers SHALL see one committed logical operation
- **AND** SHALL NOT observe an intermediate missing subtree

### Requirement: Monotonic graph revision
Every successful graph commit SHALL advance the graph revision monotonically.

#### Scenario: Revision advances
- **GIVEN** current revision R
- **WHEN** a graph-changing command commits
- **THEN** the resulting revision SHALL be greater than R

### Requirement: Operation id groups effects
All datoms/entity changes resulting from one semantic operation SHALL share an `operationId`.

#### Scenario: Reference derivation belongs to title edit
- **WHEN** editing a title removes one page reference and adds another
- **THEN** title and derived reference changes SHALL belong to one operation

### Requirement: Post-commit failures do not roll back graph state
Search indexing, mirror/export work, checksums and sync enqueue SHALL execute after graph commit and failure of one listener SHALL NOT undo the commit.

#### Scenario: Search listener fails
- **WHEN** a block update commits and search indexing fails
- **THEN** the block update SHALL remain committed
- **AND** the failure SHALL be reportable for retry/diagnostics
