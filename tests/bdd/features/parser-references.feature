@phase-03
Feature: Semantic parser and references

  Scenario: Page references are semantic nodes
    When I parse Markdown "- Discuss [[Architecture]]"
    Then the parsed inline nodes include page reference "Architecture"

  Scenario: Code literals do not become references
    When I parse Markdown "- `[[Not a page]]`"
    Then extracted page references are ""

  Scenario: Backlinks use parsed relationships
    Given parsed source block "00000000-0000-4000-8000-000000000391" contains "[[Architecture]]"
    And parsed source block "00000000-0000-4000-8000-000000000390" contains "`[[Architecture]]`"
    When I project backlinks for page "Architecture"
    Then backlink UUIDs are "00000000-0000-4000-8000-000000000391"
