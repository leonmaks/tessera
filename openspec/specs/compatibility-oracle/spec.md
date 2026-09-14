# Compatibility Oracle Specification

## Purpose

Define differential verification against a pinned Logseq baseline.

## Requirements

### Requirement: Baseline is pinned
Parity results SHALL name the exact upstream commit SHA.

#### Scenario: Unpinned baseline
- **WHEN** a parity run starts with no baseline SHA
- **THEN** it SHALL fail or explicitly skip as `UNPINNED`
- **AND** SHALL NOT claim compatibility

### Requirement: Providers execute the same scenario
A parity fixture SHALL be executable against both the upstream reference provider and the TypeScript candidate provider.

#### Scenario: Same fixture for both providers
- **GIVEN** a parity fixture and two providers
- **WHEN** the fixture is executed against each provider
- **THEN** both SHALL execute that fixture's commands

### Requirement: Comparison uses canonical state
Comparison SHALL normalize internal entity ids, transaction ids and permitted nondeterministic metadata while preserving UUIDs, content, hierarchy, properties, references and relevant ordering.

#### Scenario: Internal identity differences
- **GIVEN** snapshots differing only in internal entity and transaction ids
- **WHEN** canonical states are compared
- **THEN** those internal differences SHALL NOT affect equality

### Requirement: Deviations are explicit
Any intentional incompatibility SHALL be recorded as a named deviation with scope and rationale. The normalizer SHALL NOT silently hide semantic differences.

#### Scenario: Intentional incompatibility
- **GIVEN** an intentional semantic incompatibility
- **WHEN** its parity result is documented
- **THEN** a named deviation SHALL record its scope and rationale without hiding the difference

### Requirement: Every parity bug becomes a fixture
Once a discrepancy is fixed, the reproducer SHALL remain in the parity corpus.

#### Scenario: Retained regression fixture
- **GIVEN** a fixed parity discrepancy
- **WHEN** the parity corpus is run again
- **THEN** the discrepancy's reproducer SHALL remain included

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

### Requirement: Structural outliner parity commands are validated
The parity scenario contract SHALL validate and execute multi-block move, indent, outdent, split, and merge commands in addition to existing single-block structural commands. Unknown command shapes SHALL remain rejected before either provider executes.

#### Scenario: Multi-block structural fixture
- **GIVEN** a fixture selecting multiple block aliases
- **WHEN** it requests a multi-block move, indent, or outdent
- **THEN** both providers SHALL receive the same validated structural command

#### Scenario: Text structural fixture
- **GIVEN** a fixture addressing one block alias and text offset
- **WHEN** it requests split or merge with the previous block
- **THEN** both providers SHALL receive the same validated structural command
