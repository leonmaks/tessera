## ADDED Requirements

### Requirement: Keyword results have deterministic ordering
Keyword search SHALL order equal-score matches by UUID and enforce an explicit result limit.

#### Scenario: Equal keyword matches
- **GIVEN** two indexed blocks match a keyword equally
- **WHEN** the keyword query runs
- **THEN** results SHALL be ordered by UUID and bounded by its limit
