# Outliner Specification

## Purpose

Define structural editor behavior for blocks.

## Requirements

### Requirement: Insert supports explicit structural positions
Insert SHALL support before, after, first-child and last-child semantics.

#### Scenario: Insert after
- **GIVEN** siblings A and C
- **WHEN** B is inserted after A
- **THEN** sibling order SHALL be A, B, C

### Requirement: Move preserves subtree identity
Moving a block SHALL preserve the UUIDs and relative hierarchy of all descendants.

#### Scenario: Move subtree
- **GIVEN** A contains B which contains C
- **WHEN** B is moved under D
- **THEN** B SHALL be a child of D
- **AND** C SHALL remain a child of B
- **AND** B and C UUIDs SHALL be unchanged

### Requirement: Cycles are rejected
No structural command SHALL create a parent/descendant cycle.

#### Scenario: Move parent under descendant
- **GIVEN** B is an ancestor of C
- **WHEN** B is moved under C
- **THEN** the command SHALL fail with a structural cycle error
- **AND** graph state SHALL be unchanged

### Requirement: Indent and outdent are structural commands
Indent/outdent SHALL update parent/order using outliner semantics and preserve node identity.

#### Scenario: Indent under previous sibling
- **GIVEN** siblings A followed by B
- **WHEN** B is indented
- **THEN** B SHALL become a child of A

### Requirement: Split and merge preserve semantic text and structure
Editor split/merge SHALL change the minimum required blocks while preserving surrounding hierarchy.

#### Scenario: Split in middle
- **GIVEN** a block contains `Hello world`
- **AND** caret is after `Hello `
- **WHEN** split is executed
- **THEN** the original block SHALL contain `Hello `
- **AND** a new adjacent block SHALL contain `world`

### Requirement: Undo groups semantic operations
Undo SHALL reverse a user/domain operation as one unit, not one storage statement at a time.

#### Scenario: Undo subtree move
- **WHEN** one move operation relocates a subtree
- **AND** undo is executed once
- **THEN** the subtree SHALL return to its previous position
