## ADDED Requirements

### Requirement: Effective class properties are transitively inherited
A node's effective properties SHALL include definitions from all assigned classes and their parent classes exactly once, in deterministic property-name order.

#### Scenario: Multi-level inheritance
- **GIVEN** Employee extends Person and Person defines birthday
- **WHEN** a node has class Employee
- **THEN** birthday SHALL be effective for the node
