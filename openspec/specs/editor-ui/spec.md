## Purpose

Define observable DB-graph editor interactions while keeping the renderer separate from durable graph authority.

## Requirements

### Requirement: Editor sends semantic structural intents
The editor SHALL send insert, delete, split, merge, indent, outdent, and move intentions through the graph-worker command boundary and SHALL NOT access graph storage directly.

#### Scenario: Enter splits a focused block
- **GIVEN** a focused block with the caret within its text
- **WHEN** the user presses Enter
- **THEN** the editor SHALL issue one semantic split intention

### Requirement: Selection and hierarchy are view state
The editor SHALL represent focus, multi-selection, collapse state, and drag/drop destination as renderer-local view state derived from immutable graph snapshots.

#### Scenario: Collapse a selected subtree
- **GIVEN** a selected block with visible descendants
- **WHEN** the user collapses it
- **THEN** its descendants SHALL be hidden without changing graph state

### Requirement: Stale renderer state reloads before display
The editor SHALL request an authoritative reload when its subscribed children resource is stale and SHALL NOT render a speculative child order.

#### Scenario: Stale children resource
- **GIVEN** the mounted children resource is stale
- **WHEN** the editor renders that parent
- **THEN** it SHALL request reload before rendering a new child order
