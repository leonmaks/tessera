@phase-04 @properties @tasks-journals
Feature: Typed properties and class inheritance

  Scenario: Reject invalid typed value
    Given property "rating" has type "number" and cardinality "one"
    And block "B" exists
    When I try to set property "rating" of block "B" to text "high"
    Then the operation fails with error "INVALID_PROPERTY_VALUE"

  Scenario: Inherit property from class
    Given class "Person" defines property "birthday"
    And block "Alice" has class "Person"
    When I request effective properties of "Alice"
    Then property "birthday" is present

  Scenario: Reject class inheritance cycle
    Given class "A" extends class "B"
    And class "B" extends class "C"
    When I try to make class "C" extend class "A"
    Then the operation fails
    And the class graph is unchanged
