@phase-02
Feature: Outliner structural behavior

  Scenario: Insert a sibling after a block
    Given a page "P" with sibling blocks "A" and "C"
    When I insert block "B" after "A"
    Then the children of page "P" are "A,B,C"

  Scenario: Move a subtree to another page
    Given page "A" contains block "B"
    And block "B" contains block "C"
    And page "D" exists
    When I move block "B" to page "D"
    Then block "B" belongs to page "D"
    And block "C" belongs to page "D"
    And block "C" remains a child of block "B"
    And the UUIDs of "B" and "C" are unchanged

  Scenario: Reject a structural cycle
    Given block "B" contains block "C"
    When I try to move block "B" under block "C"
    Then the operation fails with error "OUTLINER_CYCLE"
    And the graph snapshot is unchanged
