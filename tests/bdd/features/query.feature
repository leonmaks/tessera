@phase-05
Feature: Logseq-compatible queries

  Scenario: Query tasks using simple query syntax
    Given tasks exist in statuses "TODO", "DOING" and "DONE"
    When I execute simple query "(task TODO DOING)"
    Then normalized results contain only the "TODO" and "DOING" tasks

  Scenario: Parameterized Datalog query
    Given page "Architecture" contains block "B"
    When I execute the page-block Datalog query with input "architecture"
    Then normalized results contain block "B"
