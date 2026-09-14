# Graph Data Model Specification

## Purpose

Define stable identity and graph structure shared by all runtime surfaces.

## Requirements

### Requirement: UUID is stable public identity
Every durable user-addressable node SHALL have a UUID that remains unchanged across moves, edits, sync, export/import preservation paths, and internal entity-id reassignment.

#### Scenario: Move preserves identity
- **GIVEN** block B has UUID U
- **WHEN** B is moved to another parent or page
- **THEN** B SHALL still have UUID U

### Requirement: Page and block are graph nodes
Pages and blocks SHALL participate in a unified graph identity model. Page-specific behavior MAY be represented by type/class/system attributes, but page identity SHALL not use an unrelated identity namespace.

#### Scenario: Reference may target a page node
- **WHEN** a block contains a semantic page reference
- **THEN** the reference SHALL resolve to the target page node identity

### Requirement: Tree membership is relational
Outliner hierarchy SHALL be derived from parent plus sibling order, not from an authoritative nested JSON tree.

#### Scenario: Children are ordered by membership
- **GIVEN** parent P has children A, B and C
- **WHEN** the children projection is requested
- **THEN** the result SHALL be ordered by their persisted ordering relation

### Requirement: Page membership is consistent for a subtree
Every block SHALL belong to the page containing its ancestry root.

#### Scenario: Cross-page subtree move
- **GIVEN** B contains child C on page A
- **WHEN** B is moved under page D
- **THEN** B and C SHALL belong to page D
- **AND** C SHALL remain a child of B
