## ADDED Requirements

### Requirement: Renderer applies a committed operation once
For a committed operation, the worker SHALL publish one revisioned render delta to subscriptions, and command callers SHALL receive metadata that does not cause the same mutation to be applied a second time.

#### Scenario: Command and subscription delivery
- **GIVEN** a renderer subscribed to graph G
- **WHEN** a command commits at revision R
- **THEN** the subscription receives one delta for R
- **AND** the command result SHALL not contain a separately applicable duplicate delta

### Requirement: Renderer cache is immutable and revision-aware
The renderer cache SHALL expose immutable snapshots, ignore an older or equal revision, and mark a children resource stale rather than merging a patch whose base revision does not match its cached revision.

#### Scenario: Stale children patch arrives
- **GIVEN** the renderer cache has children P at revision 10
- **WHEN** it receives a patch for P with base revision 9 and revision 11
- **THEN** the cache SHALL mark P stale without changing its cached children
