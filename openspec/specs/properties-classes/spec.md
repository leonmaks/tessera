# Properties and Classes Specification

## Purpose

Define DB-graph typed property semantics and tag/class inheritance.

## Requirements

### Requirement: Properties are schema entities
A property SHALL have durable identity, name, type, cardinality and optional constraints.

#### Scenario: Number property validates
- **GIVEN** property `rating` has type number
- **WHEN** a non-number value is assigned
- **THEN** the command SHALL fail before commit

### Requirement: Property values are typed
The database SHALL preserve numbers, booleans, dates and node references as typed values rather than flattening all values to strings.

#### Scenario: Boolean round trip
- **WHEN** checkbox property value `true` is saved and read
- **THEN** the returned value SHALL be boolean `true`

### Requirement: Cardinality is enforced
A cardinality-one property SHALL have at most one effective value; a cardinality-many property MAY have multiple values.

#### Scenario: Lossy cardinality change
- **GIVEN** a many-valued property has multiple values on at least one entity
- **WHEN** schema is changed to cardinality one
- **THEN** the change SHALL be rejected unless an explicit loss-resolution policy is supplied

### Requirement: Tags/classes may define properties
A class MAY contribute property definitions to tagged nodes.

#### Scenario: Effective properties
- **GIVEN** class Person defines `birthday`
- **AND** node N is tagged Person
- **THEN** `birthday` SHALL be an effective property of N

### Requirement: Multiple inheritance forms a DAG
Classes MAY extend multiple parent classes, but inheritance cycles SHALL be rejected.

#### Scenario: Cycle rejection
- **GIVEN** A extends B and B extends C
- **WHEN** C is configured to extend A
- **THEN** the command SHALL fail and SHALL NOT commit
