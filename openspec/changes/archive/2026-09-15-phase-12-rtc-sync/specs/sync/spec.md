## MODIFIED Requirements

### Requirement: Stale batch is rejected
A batch whose `t-before` differs from current server position SHALL be rejected as stale, include the current position, and require client pull/rebase before retry.

#### Scenario: Stale writer
- **GIVEN** server position is 12
- **WHEN** client submits `t-before = 10`
- **THEN** the response SHALL identify the current position
- **AND** the client SHALL pull/rebase before retrying
