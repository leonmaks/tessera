@working-editor
Feature: Durable local editor
  Scenario: Text survives reopening the graph
    Given a local editor graph with a page and a block
    When I save the block text as "Мои заметки"
    And reopen the local editor graph
    Then the saved editor block contains "Мои заметки"
