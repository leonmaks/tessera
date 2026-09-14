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

### Requirement: Logical operators preserve Datalog semantics
Supported compatibility SHALL include `and`, `or`, `or-join`, `not`, and `not-join`.

### Requirement: Advanced features are parity-tested
Predicates, aggregates and rules SHALL be added only with differential fixtures that specify edge cases and result normalization.
