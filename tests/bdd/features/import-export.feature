@phase-08
Feature: Semantic import/export

  Scenario: Reference survives Markdown round trip
    Given a graph block "B" contains a reference to page "Architecture"
    When the graph is exported to Logseq-compatible Markdown
    And the Markdown is imported into a new graph
    Then the normalized graph still contains the same semantic reference
