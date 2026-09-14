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

  Scenario: Indent and outdent preserve identity
    Given a page "P" with sibling blocks "A" and "B"
    When I indent block "B"
    And I outdent block "B"
    Then the children of page "P" are "A,B"

  Scenario: Split and merge a block
    Given a page "P" with sibling blocks "Hello world"
    When I split block "Hello world" at offset 6
    Then the children of page "P" are "Hello ,world"
    When I merge block "world" with its previous block
    Then the children of page "P" are "Hello world"

  Scenario: Delete a subtree as one operation
    Given page "P" contains block "B"
    And block "B" contains block "C"
    When I delete block "B"
    Then the children of page "P" are ""
    And the children of block "B" are ""

  Scenario: Undo a subtree move as one operation
    Given page "A" contains block "B"
    And block "B" contains block "C"
    And page "D" exists
    When I move block "B" to page "D"
    And I undo the last outliner operation
    Then block "B" belongs to page "A"
    And block "C" belongs to page "A"
