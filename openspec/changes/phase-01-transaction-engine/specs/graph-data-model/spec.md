## ADDED Requirements

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
