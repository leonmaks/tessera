# Outliner Specification

## Purpose

Define DB-graph structural editor behavior for ordered blocks, their hierarchy, and semantic edits.

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

### Requirement: Delete removes a selected structural subtree atomically
Deleting a live block SHALL remove that block and all of its descendants from the live outliner in one semantic operation. A later insertion or move SHALL NOT resolve a deleted block as a structural anchor.

#### Scenario: Delete subtree
- **GIVEN** B contains C and both are live blocks
- **WHEN** B is deleted
- **THEN** neither B nor C SHALL occur in their page's children projection
- **AND** observers SHALL receive one committed operation

### Requirement: Multi-block moves preserve source order
Moving multiple selected sibling-root blocks SHALL preserve their relative source order, their UUIDs, and every selected root's descendant hierarchy. A selection containing an ancestor and its descendant SHALL act on the ancestor only.

#### Scenario: Move selected siblings
- **GIVEN** page P contains A, B, and C in that order
- **WHEN** A and C are moved as a selection under page D
- **THEN** page D children SHALL be A followed by C
- **AND** A and C SHALL retain their UUIDs

### Requirement: Outliner snapshots expose ordered live membership
The DB-graph outliner SHALL expose an immutable snapshot of live pages and blocks addressed by UUID, including ordered child membership and page membership. Legacy file-graph behavior is not selected by this contract.

#### Scenario: Read ordered children
- **GIVEN** a page has live children A, B, and C
- **WHEN** its children are read
- **THEN** the projection SHALL return A, B, C in persisted structural order
