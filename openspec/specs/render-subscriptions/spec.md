# Render Subscriptions Specification

## Purpose

Define the worker-to-renderer incremental state contract.

## Requirements

### Requirement: Delta is derived from committed transaction
The worker SHALL produce renderer deltas only from committed graph state.

#### Scenario: Failed command
- **WHEN** a graph command fails validation
- **THEN** no graph render delta SHALL be published for that command

### Requirement: Delta is revisioned
Each delta SHALL include graph identity and authoritative revision.

#### Scenario: Old delta arrives late
- **GIVEN** renderer is at revision 12
- **WHEN** delta revision 11 arrives
- **THEN** the renderer SHALL ignore it

### Requirement: Blocks are complete replacements
Changed blocks in a render delta SHALL be complete immutable replacements for the subscribed block projection, not partial mutable objects.

#### Scenario: Changed subscribed block
- **GIVEN** a subscribed block projection
- **WHEN** a committed block change is published
- **THEN** the delta SHALL provide its complete immutable replacement

### Requirement: Deletions are tombstones
Deleted blocks SHALL be represented explicitly so caches can remove them.

#### Scenario: Deleted cached block
- **GIVEN** a cached block
- **WHEN** a delta reports its deletion
- **THEN** an explicit tombstone SHALL identify it for cache removal

### Requirement: Child membership patch is base-revision aware
A child patch SHALL declare the base revision it expects.

#### Scenario: Stale child patch
- **GIVEN** mounted children cache cannot reconcile the patch base revision
- **WHEN** the patch arrives
- **THEN** that children resource SHALL be marked stale and reloaded
- **AND** the patch SHALL NOT be speculatively merged

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
