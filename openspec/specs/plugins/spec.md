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

### Requirement: Change events include transaction context
A graph change event SHALL provide changed entities plus transaction data/metadata sufficient for a plugin to react once to a semantic operation.

#### Scenario: Plugin observes one semantic operation
- **GIVEN** one block edit also changes derived references
- **WHEN** the operation commits
- **THEN** the plugin change event SHALL expose transaction context that groups those effects as one operation

### Requirement: Commands are registrable
Plugins SHALL be able to register executable commands and targeted placements supported by the compatibility level.

### Requirement: Plugin failures are isolated
An exception in a plugin event handler SHALL NOT corrupt or roll back an already committed graph transaction.
