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

### Requirement: Typed EAV facts have canonical values
Every durable graph fact SHALL identify an entity UUID and an attribute identifier. Its value SHALL be one of text, finite number, boolean, timestamp, or UUID reference, and it SHALL retain that type in reads and transaction reports. The storage-specific integer entity identifier SHALL NOT be exposed as public identity.

#### Scenario: Typed reference read
- **GIVEN** an entity E with an attribute whose value references entity UUID R
- **WHEN** E is read through the public graph API
- **THEN** the attribute value SHALL be UUID R
- **AND** no storage-specific entity identifier SHALL be required to address E or R

#### Scenario: Invalid value is rejected
- **GIVEN** a graph assertion containing an unsupported value or non-finite number
- **WHEN** it is submitted as part of a transaction
- **THEN** the transaction SHALL fail without changing graph state

### Requirement: UUID allocation is durable and collision-safe
Creating a durable graph node SHALL allocate or accept a syntactically valid UUID that is unique within the graph. A rejected transaction SHALL NOT make its attempted node observable.

#### Scenario: Duplicate UUID creation
- **GIVEN** graph G already contains a node with UUID U
- **WHEN** a transaction attempts to create another node with UUID U
- **THEN** the transaction SHALL fail
- **AND** graph G SHALL still contain only its original node U

#### Scenario: Failed creation leaves no node
- **GIVEN** a transaction creates UUID U and contains a later invalid assertion
- **WHEN** validation rejects the transaction
- **THEN** UUID U SHALL not be resolvable from graph reads
