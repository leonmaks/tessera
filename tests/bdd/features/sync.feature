@phase-12
Feature: Ordered synchronization

  Scenario: Reject stale transaction batch
    Given server transaction position is 12
    When client submits a transaction batch with t-before 10
    Then the server rejects the batch as stale
    And the response reports current position 12

  Scenario: Presence is not durable graph state
    Given a user starts editing block "B"
    When a presence update is broadcast
    Then no graph transaction is committed for the presence update
