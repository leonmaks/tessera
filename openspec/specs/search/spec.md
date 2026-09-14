# Search Specification

## Purpose

Define incremental keyword and optional semantic search.

## Requirements

### Requirement: Search indexes update from committed changes
Search indexing SHALL receive added/changed/deleted graph effects after commit.

#### Scenario: Committed title update changes index
- **GIVEN** block B is searchable by its old title
- **WHEN** B commits a new title
- **THEN** incremental indexing SHALL remove the obsolete searchable text
- **AND** SHALL index the committed new title

### Requirement: Keyword search remains independently usable
Semantic/vector capabilities SHALL be optional; keyword search SHALL function without them.

#### Scenario: Keyword-only search
- **GIVEN** semantic and vector capabilities are unavailable
- **WHEN** a keyword search is requested
- **THEN** keyword search SHALL remain functional

### Requirement: Semantic search is bounded
Vector candidate retrieval and embedding execution SHALL have explicit resource limits.

#### Scenario: Bounded semantic work
- **GIVEN** configured limits for vector retrieval and embedding execution
- **WHEN** semantic search performs those operations
- **THEN** each operation SHALL respect its explicit resource limits

### Requirement: Rebuild is equivalent to incremental state
Rebuilding an index from authoritative graph state SHALL produce query results equivalent to applying the same committed history incrementally.

#### Scenario: Rebuild after history
- **GIVEN** an authoritative graph produced by a sequence of committed changes
- **WHEN** one search index is built incrementally and another is rebuilt from current graph state
- **THEN** equivalent search requests SHALL produce equivalent normalized results

### Requirement: Keyword results have deterministic ordering
Keyword search SHALL order equal-score matches by UUID and enforce an explicit result limit.

#### Scenario: Equal keyword matches
- **GIVEN** two indexed blocks match a keyword equally
- **WHEN** the keyword query runs
- **THEN** results SHALL be ordered by UUID and bounded by its limit
