## ADDED Requirements

### Requirement: Markdown and Org form equivalent nested block documents
The parser SHALL produce ordered nested block documents from Markdown list indentation and Org headline depth. Fenced code SHALL remain one code-bearing block and SHALL NOT be interpreted as nested syntax.

#### Scenario: Nested Markdown blocks
- **WHEN** Markdown contains `- A` followed by an indented `- B`
- **THEN** the document SHALL contain A with B as its child

#### Scenario: Org heading blocks
- **WHEN** Org contains `* A` followed by `** B`
- **THEN** the document SHALL contain A with B as its child

### Requirement: Reference extraction is AST-based and deterministic
Reference extraction SHALL derive page, block, tag, embed and link targets from semantic inline nodes, ignore code nodes, and return an immutable canonical ordering.

#### Scenario: Mixed inline references
- **WHEN** a block contains a page reference, tag, block reference and code span with a page-looking literal
- **THEN** extraction SHALL include the first three semantic targets
- **AND** extraction SHALL exclude the code literal

### Requirement: Aliases and namespaces have stable page keys
Page references and tags SHALL preserve their displayed title, derive a canonical case-folded key, and expose namespace components split by `/`. Alias lookup SHALL return the canonical target without text-substring matching.

#### Scenario: Namespaced alias
- **GIVEN** page `Project/Architecture` has alias `System Design`
- **WHEN** `[[System Design]]` is resolved
- **THEN** it SHALL resolve to `Project/Architecture`
- **AND** its namespace components SHALL be `Project`, `Architecture`

### Requirement: Backlink projections are immutable semantic snapshots
Given parsed source blocks, backlink projection SHALL return the source block UUIDs that semantically target a page or block in deterministic UUID order. References inside code SHALL not produce backlinks.

#### Scenario: Ordered backlinks
- **GIVEN** two source blocks with UUIDs U2 and U1 both reference page Architecture
- **WHEN** backlinks for Architecture are requested
- **THEN** the result SHALL be U1 followed by U2
