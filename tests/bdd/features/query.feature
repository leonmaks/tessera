@phase-05 @query-engine
Feature: Logseq-compatible queries

  Scenario: Query tasks using simple query syntax
    Given tasks exist in statuses "TODO", "DOING" and "DONE"
    When I execute simple query "(task TODO DOING)"
    Then normalized results contain only the "TODO" and "DOING" tasks

  Scenario: Parameterized Datalog query
    Given query page "Architecture" contains block "B"
    When I execute the page-block Datalog query with input "architecture"
    Then normalized results contain block "B"

  Scenario: Logical clauses preserve bindings
    Given query facts for active tasks and archived blocks
    When I execute a query using and, or-join and not-join
    Then normalized query rows are "A" and "B"

  Scenario: Pull, predicates, aggregates and rules compose
    Given query facts for active tasks and archived blocks
    When I execute a rule query with a predicate, aggregate and pull
    Then the advanced query result is normalized

  Scenario: Query limits fail without partial output
    Given a query engine limited to one result
    When I execute a query returning two rows
    Then the query fails with a query limit error and no result
