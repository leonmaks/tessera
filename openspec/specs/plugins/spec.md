# Plugin Compatibility Specification

## Purpose

Define the targeted Logseq plugin-facing capability facade.

## Requirements

### Requirement: Plugins use capability APIs
Plugins SHALL mutate graph data through Editor/domain capability APIs, not raw SQLite writes.

#### Scenario: Plugin updates a block
- **WHEN** a plugin updates a block through the Editor facade
- **THEN** the update SHALL execute through the same semantic command path as first-party clients
- **AND** the plugin SHALL NOT receive a raw SQLite write capability

### Requirement: DB query APIs are available
The targeted facade SHALL include simple query, custom query and Datalog-compatible query calls.

#### Scenario: Targeted query calls
- **GIVEN** a plugin using the targeted facade
- **WHEN** it invokes a supported simple, custom or Datalog query
- **THEN** the corresponding query capability SHALL be available

### Requirement: Change events include transaction context
A graph change event SHALL provide changed entities plus transaction data/metadata sufficient for a plugin to react once to a semantic operation.

#### Scenario: Plugin observes one semantic operation
- **GIVEN** one block edit also changes derived references
- **WHEN** the operation commits
- **THEN** the plugin change event SHALL expose transaction context that groups those effects as one operation

### Requirement: Commands are registrable
Plugins SHALL be able to register executable commands and targeted placements supported by the compatibility level.

#### Scenario: Registered command
- **GIVEN** a plugin command registered at a supported placement
- **WHEN** that command is invoked
- **THEN** its registered executable action SHALL run

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

### Requirement: Plugin failures are isolated
An exception in a plugin event handler SHALL NOT corrupt or roll back an already committed graph transaction.

#### Scenario: Handler throws after commit
- **GIVEN** a committed graph transaction
- **WHEN** a plugin event handler throws
- **THEN** the transaction SHALL remain committed and uncorrupted
