## ADDED Requirements

### Requirement: Plugin command registration is deterministic
The host SHALL reject duplicate plugin command identifiers and SHALL execute only the registered command action.

#### Scenario: Duplicate registration
- **GIVEN** a plugin command identifier is registered
- **WHEN** another plugin registers the same identifier
- **THEN** registration SHALL fail without replacing the original action

### Requirement: Plugin command parity fixtures are validated
The compatibility harness SHALL validate plugin command identifier and arguments before candidate and reference providers execute the fixture.

#### Scenario: Command parity fixture
- **GIVEN** a plugin command parity fixture with an identifier and arguments
- **WHEN** it runs against candidate and reference providers
- **THEN** both providers SHALL receive the same validated semantic command
