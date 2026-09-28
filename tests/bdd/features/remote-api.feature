@phase-13
Feature: Remote semantic API
  Scenario: Raw mutation is rejected
    Given a remote semantic API
    When a caller submits a raw mutation
    Then the remote API rejects it before dispatch
