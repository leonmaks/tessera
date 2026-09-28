@phase-control @phase-quality-gates
Feature: Phase quality gates
  The repository must stop phase work until an independent review authorizes it.

  Scenario: Audit reports a locked handoff
    When the phase audit gate runs
    Then the phase gate passes
    And implementation is reported as locked

  Scenario: PRE cannot bypass the handoff checkpoint
    When the phase PRE gate runs
    Then the phase gate fails
    And the phase gate explains that handoff approval is required
