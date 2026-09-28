## ADDED Requirements

### Requirement: Local editor persists actual text and structure
The local-hosted editor SHALL edit UUID-addressed pages and blocks through semantic commands and reload committed content from filesystem SQLite after restarting the host. Draft text SHALL remain distinct from authoritative snapshots.

#### Scenario: Edit and reopen
- **GIVEN** an open page
- **WHEN** a user types block text and saving completes
- **THEN** reloading the page or restarting the host SHALL recover the text and hierarchy

#### Scenario: Keyboard editing
- **GIVEN** a caret in editable block text
- **WHEN** Enter, Tab, Shift+Tab or Backspace at the start is pressed
- **THEN** the corresponding split, indent, outdent or previous-sibling merge SHALL change the stored graph and restore focus
- **AND** ordinary Backspace/Delete within text SHALL edit characters normally

### Requirement: Local editor provides usable page and tree controls
Users SHALL create, rename, search and navigate pages, select and move blocks, collapse/expand descendants, download page Markdown and undo/redo session edits.

Collapse/expand SHALL remain local interface state and SHALL NOT be written to the authoritative graph or synchronized through graph transactions. This is the explicitly accepted product deviation `TESSERA-LOCAL-COLLAPSE` from DB-Logseq.

#### Scenario: Collapse and expand
- **GIVEN** a block with descendants
- **WHEN** the collapse control is clicked twice
- **THEN** descendants SHALL first hide and then reappear without a graph mutation

#### Scenario: Page navigation
- **GIVEN** two saved pages
- **WHEN** the user selects a page in navigation
- **THEN** its ordered blocks SHALL be displayed and editable

### Requirement: Failed saves remain visible and recoverable
The editor SHALL display pending, saved and failed save states. Stale writes SHALL be rejected before mutation and SHALL retain the draft for explicit retry after authoritative reload.

#### Scenario: Another tab changes the graph
- **GIVEN** a request based on an older revision
- **WHEN** it reaches the worker
- **THEN** no mutation SHALL occur and the editor SHALL reload the snapshot while retaining unsaved text
