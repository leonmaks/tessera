## Purpose

Provide a fail-closed remote boundary for authorized semantic graph operations without exposing raw graph writes.

## ADDED Requirements

### Requirement: Remote operations are scoped and semantic
The API SHALL validate a scope before dispatching a supported semantic operation and SHALL reject raw datom mutations.

#### Scenario: Unauthorized raw mutation
- **WHEN** a caller submits a raw datom mutation
- **THEN** the API SHALL reject it without invoking graph authority

### Requirement: Limits fail closed
The API SHALL reject payloads above its configured limit before dispatch.

#### Scenario: Oversized request
- **WHEN** a request exceeds the configured size limit
- **THEN** the API SHALL reject it
