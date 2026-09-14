## ADDED Requirements

### Requirement: Journal lookup is idempotent
Requesting a journal for the same canonical ISO date SHALL return the same UUID regardless of display format or repeated requests.

#### Scenario: Repeated daily lookup
- **WHEN** a journal for `2026-09-14` is requested twice
- **THEN** both results SHALL identify the same journal UUID
