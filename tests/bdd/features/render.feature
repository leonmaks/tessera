@phase-06
Feature: Revision-aware renderer subscriptions

  Scenario: Ignore an old delta
    Given the renderer cache is at revision 12
    When a delta for revision 11 arrives
    Then the renderer cache is unchanged

  Scenario: Reload stale children
    Given children of "P" are cached at revision 10
    When a children patch for "P" requires base revision 9
    Then children resource "P" is marked stale
    And the patch is not speculatively merged
