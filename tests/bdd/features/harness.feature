@phase00 @baseline
Feature: Repository parity harness
  Scenario: Pinned test-double comparison
    Given harness providers return equivalent snapshots
    When harness comparison runs
    Then harness reports equality with the exact SHA and no upstream claim

  Scenario: Semantic mismatch
    Given harness providers return different content
    When harness comparison runs
    Then harness reports a semantic discrepancy

  Scenario: Unpinned baseline
    Given harness has no baseline pin
    When harness comparison runs
    Then harness rejects the run

  Scenario: Invalid provenance
    Given harness reference has another baseline
    When harness comparison runs
    Then harness rejects the run

  Scenario: Invalid snapshot
    Given harness provider returns an invalid snapshot
    When harness comparison runs
    Then harness rejects the run

  Scenario: Named local collapse deviation
    Then harness records the local collapse deviation explicitly

  Scenario: Malformed scenario command
    Given harness has a malformed command
    When harness comparison runs
    Then harness rejects the run

  Scenario: Deterministic ports
    Then harness ports replay and reject exhaustion

  Scenario: Architecture guards
    Then harness boundaries reject private imports and allow public imports
