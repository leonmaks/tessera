## ADDED Requirements

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
