@phase01
Feature: Authoritative graph transactions
  Scenario: Atomic rejection
    Given a Phase 01 graph at revision 0
    When I submit a graph transaction with a valid fact and an invalid value
    Then the Phase 01 transaction is rejected without a revision change

  Scenario: Idempotent replay
    Given a Phase 01 graph with a committed operation
    When I retry the identical Phase 01 operation
    Then I receive the original Phase 01 report without another revision

  Scenario: Conflicting replay
    Given a Phase 01 graph with a committed operation
    When I reuse its Phase 01 operation id with changed assertions
    Then the Phase 01 transaction is rejected without a revision change

  Scenario: Absent public pull
    Given a Phase 01 graph at revision 0
    When I pull an absent Phase 01 UUID
    Then the Phase 01 pull reports absence

  Scenario: Listener isolation
    Given a Phase 01 graph with one failing and one healthy listener
    When I submit a valid Phase 01 transaction
    Then the healthy Phase 01 listener receives the committed report

  Scenario: Recovery after interrupted transaction
    Given a Phase 01 graph transaction is interrupted before commit
    When the Phase 01 graph is reopened
    Then the interrupted Phase 01 facts are absent
