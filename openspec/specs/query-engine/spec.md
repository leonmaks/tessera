# Query Engine Specification

## Purpose

Define simple-query and Datalog-compatible behavior.

## Requirements

### Requirement: Simple queries compile to graph query semantics
The product SHALL accept the targeted Logseq simple-query syntax and return results equivalent to the pinned baseline.

#### Scenario: Task simple query
- **WHEN** `(task TODO DOING)` is executed against the same canonical graph
- **THEN** normalized candidate results SHALL equal normalized upstream results

### Requirement: Datalog core clauses are supported
Target compatibility SHALL include `:find`, `:in`, `:where`, variable unification and entity attribute matching.

#### Scenario: Parameterized page query
- **WHEN** a Datalog query receives a page name input
- **THEN** only bindings satisfying that input SHALL be returned

### Requirement: Pull materializes entity projections
`pull` SHALL materialize requested attributes while respecting cardinality and nested patterns in the supported subset.

#### Scenario: Nested projection
- **GIVEN** an entity with attributes matching a supported nested pull pattern
- **WHEN** pull evaluates that pattern
- **THEN** the projection SHALL contain the requested attributes with their cardinality and nesting

### Requirement: Logical operators preserve Datalog semantics
Supported compatibility SHALL include `and`, `or`, `or-join`, `not`, and `not-join`.

#### Scenario: Supported logical clauses
- **GIVEN** a supported query using and, or, or-join, not or not-join
- **WHEN** the query executes against the pinned canonical graph
- **THEN** its results SHALL preserve the corresponding Datalog semantics

### Requirement: Advanced features are parity-tested
Predicates, aggregates and rules SHALL be added only with differential fixtures that specify edge cases and result normalization.

#### Scenario: Advanced feature acceptance
- **GIVEN** a proposed predicate, aggregate or rule
- **WHEN** the feature is added to compatibility support
- **THEN** differential fixtures SHALL specify its edge cases and result normalization
