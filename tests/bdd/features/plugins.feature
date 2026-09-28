@phase-10
Feature: Plugin capability facade
  Scenario: A plugin command uses the registered semantic action
    Given a plugin facade with semantic capabilities
    When the plugin registers and invokes command "example/run"
    Then the plugin command action runs once

  Scenario: A plugin event failure is isolated after commit
    Given a plugin facade with semantic capabilities
    And one plugin change handler throws
    When a committed plugin graph change is published
    Then a later plugin change handler still receives it
