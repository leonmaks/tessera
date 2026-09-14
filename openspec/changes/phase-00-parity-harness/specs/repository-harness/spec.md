## Purpose

Provide reproducible test inputs and enforce repository dependency boundaries before graph implementation.

## ADDED Requirements

### Requirement: Deterministic ports replay
The harness SHALL replay supplied UUIDs and clock values in order and fail explicitly when exhausted.

#### Scenario: Replay and exhaustion
- **GIVEN** identical finite UUID and clock sequences
- **WHEN** two fresh port instances consume them
- **THEN** both return identical values in order and reject further reads

### Requirement: Architecture checks enforce dependency boundaries
The checker SHALL reject forbidden graph-db dependencies and cross-package private source imports, including relative imports, re-exports and literal dynamic imports. Domain code SHALL reject framework, SQLite and browser-global dependencies.

#### Scenario: Forbidden import forms
- **GIVEN** an application importing graph-db through a package or relative path
- **WHEN** boundaries are checked
- **THEN** the checker reports a violation

#### Scenario: Public imports and comments
- **GIVEN** a valid public package import and a comment mentioning a forbidden import
- **WHEN** boundaries are checked
- **THEN** no violation is reported
