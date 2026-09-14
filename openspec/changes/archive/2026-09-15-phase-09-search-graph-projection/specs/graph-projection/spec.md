## Purpose

Provide bounded semantic graph neighborhoods for graph views without making those views graph authorities.

## ADDED Requirements

### Requirement: Projection is bounded and deterministic
A graph projection SHALL return a deterministic neighborhood constrained by configured node and edge caps.

#### Scenario: Projection cap
- **GIVEN** a root with more neighbors than the configured cap
- **WHEN** its graph view is projected
- **THEN** the result SHALL contain no more than the configured nodes and edges
