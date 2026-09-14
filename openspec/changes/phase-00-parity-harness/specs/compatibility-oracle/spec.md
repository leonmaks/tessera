## ADDED Requirements

### Requirement: Validated harness execution
The harness SHALL validate scenario commands and canonical provider snapshots at runtime, reject invalid UUIDs and duplicate node identities, and execute separate copies of the same scenario against both providers. Missing or malformed pins SHALL fail before execution. A reference provider SHALL declare the matching baseline SHA and whether its evidence is upstream execution or a test double. Reports SHALL include the SHA, provider identities, evidence kind and equality result. Test doubles SHALL NOT claim upstream compatibility.

#### Scenario: Pinned comparison
- **GIVEN** a valid pinned baseline and matching reference provenance
- **WHEN** both providers return equal canonical states
- **THEN** the report identifies the exact SHA and equality

#### Scenario: Invalid execution inputs
- **GIVEN** an unpinned baseline, mismatched reference SHA, invalid command or malformed snapshot
- **WHEN** comparison is requested
- **THEN** it fails without claiming compatibility

### Requirement: Conservative canonicalization
Canonicalization SHALL sort nodes by UUID and unordered tags, refs and property object keys without mutating the source. It SHALL preserve property array order, hierarchy, order tokens, content and UUIDs. Internal metadata SHALL be projected out by adapters before strict canonical validation; unknown canonical fields SHALL be rejected.

#### Scenario: Equivalent enumeration
- **GIVEN** snapshots differing only in node, tag, reference or object key enumeration order
- **WHEN** compared
- **THEN** they compare equal

#### Scenario: Semantic discrepancy
- **GIVEN** snapshots differing in content, identity, hierarchy, ordering or property array order
- **WHEN** compared
- **THEN** they compare unequal and both canonical states remain available in the report
