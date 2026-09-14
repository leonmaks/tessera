@phase-07
Feature: Semantic browser editor

  Scenario: Enter creates a semantic split intent
    Given a focused editor block "B" with content "Hello world" and caret 6
    When the editor receives the Enter key
    Then it sends split intent for block "B" at offset 6

  Scenario: Collapse is renderer-local
    Given an expanded editor block "B" with descendants
    When the editor collapses block "B"
    Then descendants of "B" are hidden without a graph command
