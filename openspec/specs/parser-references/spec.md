# Parser and References Specification

## Purpose

Define Logseq-compatible Markdown/Org semantic parsing and graph references.

## Requirements

### Requirement: Parsing produces semantic inline nodes
Parser output SHALL distinguish plain text, page refs, block refs, tags, links, code, embeds, macros and temporal tokens where supported.

#### Scenario: Page reference
- **WHEN** `Discuss [[Architecture]]` is parsed
- **THEN** `[[Architecture]]` SHALL be represented as a page-reference node

### Requirement: Code content does not create semantic references
Reference-looking text inside code spans/fences SHALL remain code unless upstream behavior explicitly says otherwise.

#### Scenario: Reference-looking code span
- **WHEN** `` `[[Not a page]]` `` is parsed
- **THEN** no page reference SHALL be materialized

### Requirement: Block references resolve by UUID
`((uuid))` references SHALL target durable block UUID identity.

#### Scenario: Referenced block moves
- **GIVEN** block A references block B by UUID
- **WHEN** B moves to another page
- **THEN** A SHALL still resolve to B

### Requirement: Backlinks use semantic relationships
Linked references SHALL be derived from parsed/materialized relationships, not text substring search.

#### Scenario: Code does not create backlink
- **GIVEN** page Architecture exists
- **AND** block B contains a code span `[[Architecture]]`
- **THEN** B SHALL NOT appear as a linked reference solely because of that code span
