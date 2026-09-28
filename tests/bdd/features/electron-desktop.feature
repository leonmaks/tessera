@electron-desktop
Feature: Independent and safe desktop editor
  Scenario: Saved graph survives desktop runtime restart
    Given an isolated desktop graph host
    When a desktop page is saved and the host restarts
    Then the desktop page remains persisted

  Scenario: Concurrent desktop clients share the writer
    Given an isolated desktop graph host
    When another desktop client opens the same graph
    Then the original writer remains the only owner

  Scenario: Unauthorized graph requests
    Given an isolated desktop graph host
    When an unauthenticated caller requests the graph
    Then the desktop request is rejected without changing revision

  Scenario Outline: Closing cannot silently lose a draft
    Given a desktop close choice of "<choice>"
    When desktop saving returns "<saved>"
    Then desktop closing is "<allowed>"
    Examples:
      | choice  | saved | allowed |
      | save    | true  | true    |
      | save    | false | false   |
      | cancel  | true  | false   |
      | discard | false | true    |

  Scenario: Hostile content cannot navigate the desktop shell
    When a note targets an untrusted native URL
    Then the desktop navigation is denied

  Scenario Outline: Native desktop acceptance
    Given the built Electron desktop client
    When the native desktop scenario "<scenario>" runs
    Then its observable desktop contract passes
    Examples:
      | scenario           |
      | SQLite runtime     |
      | renderer isolation |
      | close:             |
      | export:            |
      | startup failure    |
      | ownership:         |
      | packaged:          |
      | cross-shell:       |
