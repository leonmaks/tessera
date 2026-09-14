# Tasks and Journals Specification

## Purpose

Define task state and journal identity behavior.

## Requirements

### Requirement: Task is graph data, not only text decoration
In DB mode, task status/priority/schedule/deadline SHALL be represented as typed graph semantics.

#### Scenario: Status change
- **GIVEN** task T is Todo
- **WHEN** its status changes to Doing
- **THEN** queries and projections SHALL observe Doing without reparsing Markdown text as the authority

### Requirement: Task cycling is deterministic
The configured task-cycle command SHALL advance through its configured statuses in a deterministic order.

#### Scenario: Cycle task status
- **GIVEN** task T is Todo
- **WHEN** cycle-status command is executed
- **THEN** T SHALL move to the next configured status

### Requirement: Repeating tasks advance atomically
Completing a repeating task SHALL update completion/repeat-related state as one domain operation.

#### Scenario: Daily repeating task
- **GIVEN** task T repeats daily and is scheduled on date D
- **WHEN** T is completed
- **THEN** its next scheduled date SHALL be advanced according to the repeat rule
- **AND** the resulting task status SHALL follow configured repeat semantics

### Requirement: Journal identity is canonical by date
Presentation formatting SHALL NOT change journal identity.

#### Scenario: Date format changes
- **GIVEN** a journal exists for canonical date D
- **WHEN** display date format changes
- **THEN** requests for date D SHALL resolve to the same journal node
