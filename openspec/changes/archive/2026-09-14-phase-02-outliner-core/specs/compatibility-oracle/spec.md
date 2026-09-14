## ADDED Requirements

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
