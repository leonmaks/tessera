## ADDED Requirements

### Requirement: Query evaluation is bounded and deterministic
Supported queries SHALL return rows in canonical JSON ordering and SHALL reject evaluation exceeding configured step or result limits without partial output.

#### Scenario: Result limit
- **GIVEN** a query whose result count exceeds its configured limit
- **WHEN** evaluation runs
- **THEN** it SHALL fail with a query limit error
