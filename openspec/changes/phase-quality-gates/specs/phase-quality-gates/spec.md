# Spec Delta

## Purpose

Define a machine-enforced implementation lifecycle that prevents a Tessera phase from advancing without approved scope, observable behavior evidence, architecture checks and independent review.

## ADDED Requirements

### Requirement: A phase has one explicit authorized change and scope

Each implementation phase SHALL name exactly one active OpenSpec change, one phase identifier, one approved baseline, one implementation scope and one process-control scope. The next phase SHALL remain disabled until the current phase is closed.

#### Scenario: Scope drift

- **GIVEN** a phase control record with an approved implementation scope
- **WHEN** a changed file is outside the implementation or process-control scope
- **THEN** the executable gate SHALL fail
- **AND** it SHALL identify the file and the scope violation

#### Scenario: Premature phase advancement

- **GIVEN** an active phase whose post gate is not PASS
- **WHEN** a phase transition is requested
- **THEN** the gate SHALL reject the transition
- **AND** SHALL keep `NEXT_PHASE_ALLOWED` false

### Requirement: PRE review is independent and tied to immutable planning artifacts

Implementation SHALL require a fresh read-only PRE review whose report identifies the active change, phase, reviewer context, non-empty preconditions, reviewed artifacts and exact artifact fingerprints. The reviewer identity/model SHALL differ from the implementation model.

#### Scenario: Missing PRE approval

- **GIVEN** OpenSpec planning artifacts exist but no valid independent PRE report exists
- **WHEN** implementation gate evaluation starts
- **THEN** the gate SHALL return FAIL
- **AND** SHALL reject production implementation as not authorized

#### Scenario: Planning artifact changed after PRE review

- **GIVEN** a PRE report with fingerprints for proposal, spec, design, tasks and control files
- **WHEN** one fingerprint no longer matches the workspace
- **THEN** the gate SHALL return FAIL
- **AND** SHALL require a new PRE review

### Requirement: Observable behavior and architecture evidence are mandatory

Before POST review, the phase SHALL provide the BDD/TDD/property, parity, typecheck, OpenSpec validation, architecture-gate and full verification results required by its tasks and roadmap exit criteria. A test double SHALL NOT be reported as upstream parity.

#### Scenario: Incomplete evidence

- **GIVEN** implementation tasks are checked but one required command is missing or failed
- **WHEN** POST gate evaluation starts
- **THEN** the gate SHALL return FAIL
- **AND** SHALL list the missing or failed evidence

#### Scenario: Architecture bypass

- **GIVEN** product code changed outside the allowed dependency direction or a raw graph write path was added
- **WHEN** the executable architecture gate runs
- **THEN** the phase SHALL fail regardless of unit-test results

### Requirement: Independent POST review controls archive

OpenSpec Verify and the machine gate SHALL complete before a fresh independent POST review. POST evidence SHALL include passing parity, non-empty postconditions and actual verification command results. Archive and next-phase authorization SHALL require POST PASS, complete evidence and no scope drift.

#### Scenario: Implementer self-approval

- **GIVEN** a POST report signed by the same model identity as the implementation
- **WHEN** archive eligibility is evaluated
- **THEN** the gate SHALL return FAIL
- **AND** SHALL not authorize archive

#### Scenario: Successful checkpoint

- **GIVEN** OpenSpec Verify PASS, machine gate PASS, complete evidence and an independent POST PASS
- **WHEN** archive eligibility is evaluated
- **THEN** the gate SHALL return PASS
- **AND** SHALL permit the change to be archived while the next phase remains disabled until a separate transition checkpoint

### Requirement: Model escalation is explicit

Each phase SHALL declare an implementation model class, a test/fix model class and an independent review model class. Persistence/migration, distributed sync, security, public compatibility, upstream conflicts and final release decisions SHALL require escalation to a stronger model outside the routine worker set.

#### Scenario: Model below required level

- **GIVEN** a phase declares a stronger model requirement for its current task
- **WHEN** the selected implementation model is below that requirement
- **THEN** the gate SHALL return a model-switch recommendation
- **AND** SHALL not authorize the affected checkpoint

#### Scenario: Strong reviewer required

- **GIVEN** a task changes a public contract, schema, distributed protocol or security boundary
- **WHEN** the task is submitted for review
- **THEN** the phase record SHALL require a stronger independent reviewer
- **AND** a routine implementation model SHALL not self-issue PASS
