## ADDED Requirements

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
