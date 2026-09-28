## ADDED Requirements

### Requirement: Desktop editor launches independently
The Windows desktop distribution SHALL launch the Tessera editor without a development server, network connection or separately installed Node.js. It SHALL provide the existing page, block, search, history and Markdown export interactions through semantic graph commands. Collapse SHALL retain the accepted local-interface behavior `TESSERA-LOCAL-COLLAPSE`.

#### Scenario: Offline first launch
- **GIVEN** an unpacked Windows desktop distribution and a writable user profile
- **WHEN** the user launches Tessera without Vite or internet access
- **THEN** an editable window SHALL open and allow creation of a page and block

#### Scenario: Existing editor behavior
- **GIVEN** a desktop page with nested blocks
- **WHEN** the user edits, splits, indents, moves or undoes blocks
- **THEN** the stored text and tree SHALL follow the same semantic commands as the web editor
- **AND** collapse SHALL NOT create a graph transaction

### Requirement: Desktop data survives application lifecycle
Desktop graph data SHALL reside in a stable writable user-data location outside the installation directory. An explicit graph-path override SHALL be supported without silently copying, migrating or deleting existing graphs. A second application launch SHALL activate the existing desktop instance without creating a second writer. Graph ownership and stale-owner recovery SHALL honor the existing runtime-persistence contracts.

#### Scenario: Restart after save
- **GIVEN** a page and nested block edits acknowledged as saved
- **WHEN** the app exits and restarts from another working directory
- **THEN** the same graph UUIDs, content, hierarchy and committed revision SHALL remain available

#### Scenario: Second desktop launch
- **GIVEN** Tessera already owns its desktop profile
- **WHEN** a second Tessera process launches
- **THEN** the original window SHALL be activated and its worker SHALL remain the only writer

#### Scenario: Existing graph selected
- **GIVEN** a graph-path override points to an existing web-editor SQLite graph
- **WHEN** the desktop client opens it
- **THEN** it SHALL honor existing writer ownership before editing and SHALL NOT overwrite or silently replace that graph

### Requirement: Desktop renderer is isolated
Desktop content SHALL NOT receive general filesystem, process execution or raw graph-write capabilities. Untrusted navigation, popups, permissions and malformed or unauthorized transport messages SHALL be rejected. Packaged assets SHALL not expose arbitrary local files.

#### Scenario: Hostile note content
- **GIVEN** a note contains markup, a script fragment or a filesystem URL
- **WHEN** it is displayed or used as a navigation target
- **THEN** it SHALL NOT execute native code, navigate the editor to untrusted content or read arbitrary local files

#### Scenario: Unauthorized graph request
- **GIVEN** a caller outside the trusted app session or an invalid command payload
- **WHEN** it requests a graph mutation
- **THEN** access SHALL be rejected without changing graph revision

### Requirement: Desktop failures and closing preserve user control
Startup and worker failures SHALL be visible and SHALL NOT be reported as successful saves. Closing with pending drafts SHALL offer saving, cancellation or explicit discard; failed saving SHALL keep the window and drafts available. An orderly exit SHALL drain acknowledged work, close owned resources and release only ownership held by that process.

#### Scenario: Close with pending edits
- **GIVEN** a block has an unsaved draft
- **WHEN** the user closes the desktop window
- **THEN** the app SHALL save before closing or let the user cancel or explicitly discard
- **AND** a failed save SHALL not silently lose the draft

#### Scenario: Worker startup failure
- **GIVEN** the graph is unavailable or the worker cannot initialize
- **WHEN** Tessera starts
- **THEN** it SHALL show an actionable error and SHALL NOT display a false saved state

### Requirement: Desktop Markdown export uses a user-selected destination
Desktop page export SHALL offer a native save destination and write the page's Markdown only after selection. Cancelling the dialog SHALL create no output file and SHALL NOT change the graph.

#### Scenario: Save or cancel export
- **GIVEN** an open desktop page
- **WHEN** Markdown export is requested
- **THEN** the user SHALL choose a destination or cancel
- **AND** a confirmed export SHALL match the web editor's Markdown content
