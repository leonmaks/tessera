# Import and Export Specification

## Purpose

Define Markdown/Org compatibility and semantic round trips.

## Requirements

### Requirement: Import materializes semantic graph data
Import SHALL parse hierarchy, references, tags, properties, tasks and supported assets into graph semantics.

### Requirement: Export preserves graph semantics
Export SHALL serialize supported graph semantics using the Logseq-compatible textual representation for the selected profile.

#### Scenario: Node property
- **GIVEN** node property Owner references Alice
- **WHEN** a Logseq-compatible Markdown export is produced
- **THEN** it SHALL use the compatible node-reference representation

### Requirement: Semantic round trip
For supported features, export followed by import SHALL preserve the normalized logical graph.

#### Scenario: Round trip ignores physical ids
- **WHEN** graph A is exported and imported into graph B
- **THEN** normalized semantic state SHALL match
- **AND** differences only in internal transaction/entity ids MAY be ignored

### Requirement: Large/deep input is bounded
Import SHALL protect runtime memory/stack from deeply nested or massive inputs while preserving deterministic failure/reporting.
