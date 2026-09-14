@phase-09
Feature: Rebuildable search
  Scenario: Keyword search works without semantic provider
    Given searchable blocks "A" and "B" contain "hello"
    When I keyword search "hello"
    Then search results are "A,B"
