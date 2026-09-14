## ADDED Requirements

### Requirement: Transaction validation and commit are atomic
A graph transaction SHALL validate all assertions before committing durable facts. A failed validation or persistence error SHALL leave the revision, visible facts and operation history unchanged.

#### Scenario: Invalid assertion in a batch
- **GIVEN** a transaction contains one valid assertion and one invalid assertion
- **WHEN** the transaction is submitted
- **THEN** it SHALL fail
- **AND** neither assertion SHALL be visible
- **AND** the graph revision SHALL not advance

### Requirement: Transaction reports are complete and deterministic
A successful transaction SHALL return one report containing its transaction identifier, operationId, resulting revision and every added or retracted fact in canonical order. Repeating a completed operationId with byte-equivalent input SHALL return the original report without another commit; reusing it with different input SHALL fail.

#### Scenario: Retried operation
- **GIVEN** operation O has committed at revision R
- **WHEN** the same transaction input with operation O is retried
- **THEN** the result SHALL identify revision R
- **AND** no additional facts or revision SHALL be created

#### Scenario: Conflicting operation replay
- **GIVEN** operation O has committed with one transaction input
- **WHEN** O is submitted with different assertions or source metadata
- **THEN** the request SHALL fail without changing graph state

### Requirement: Public pull reads are UUID-addressed snapshots
A public pull SHALL address an entity by UUID, return an immutable projection of requested attributes, and distinguish an absent entity from an omitted attribute. Equal graph states and patterns SHALL produce deterministically ordered projections.

#### Scenario: Absent entity
- **GIVEN** UUID U is not present in graph G
- **WHEN** U is pulled through the public API
- **THEN** the API SHALL report entity absence

#### Scenario: Repeated projection
- **GIVEN** graph G has not changed
- **WHEN** the same UUID and pull pattern are read twice
- **THEN** the projections SHALL be equal in canonical order

### Requirement: Post-commit listeners are isolated
After a transaction commits, each registered post-commit listener SHALL receive the complete report independently. A listener failure SHALL be recorded for diagnostics and retry without preventing later listeners from receiving the report or changing the committed result.

#### Scenario: One listener fails
- **GIVEN** two post-commit listeners and the first listener fails
- **WHEN** a transaction commits
- **THEN** the second listener SHALL still receive the report
- **AND** the committed facts and revision SHALL remain unchanged
