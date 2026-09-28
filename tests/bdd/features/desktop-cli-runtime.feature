@phase-11
Feature: Desktop CLI runtime
  Scenario: A healthy graph owner is reused
    Given a healthy graph daemon owns "graph"
    When another runtime starts "graph"
    Then it reuses the existing graph daemon
