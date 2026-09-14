# Import and Export Specification

## Purpose

Define Markdown/Org compatibility and semantic round trips.

## Requirements

### Requirement: Import materializes semantic graph data
Import SHALL parse hierarchy, references, tags, properties, tasks and supported assets into graph semantics.

#### Scenario: Supported semantic import
- **GIVEN** input containing supported hierarchy, references, tags, properties, tasks and assets
- **WHEN** the input is imported
- **THEN** those supported features SHALL be materialized in graph semantics

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

#### Scenario: Input exceeds supported resource bounds
- **GIVEN** deeply nested or massive input exceeding supported resource bounds
- **WHEN** import is attempted
- **THEN** failure and reporting SHALL be deterministic within the protected memory and stack bounds

### Requirement: Asset references are portable metadata
Import and export SHALL preserve supported asset references as logical metadata without treating asset bytes as inline graph text.

#### Scenario: Markdown asset link
- **GIVEN** a block contains a supported Markdown asset link
- **WHEN** it is imported and exported
- **THEN** its normalized asset reference SHALL be preserved

### Requirement: Resource limits are deterministic
The importer SHALL reject input exceeding configured character or structural-depth limits before returning a partial semantic document.

#### Scenario: Depth limit
- **GIVEN** input deeper than its configured limit
- **WHEN** import runs
- **THEN** it SHALL fail with a deterministic import-limit error
