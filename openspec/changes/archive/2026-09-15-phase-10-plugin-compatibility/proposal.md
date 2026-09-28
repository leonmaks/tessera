## Why

Plugins need a stable compatibility facade without a database escape hatch. This phase exposes queries, semantic editor commands, events and command registration through injected capabilities only.

## What Changes

- Add plugin host facade delegating to semantic command/query ports.
- Add isolated change events and registered commands.
- Verify raw graph-write APIs are unavailable through a validated parity scenario for plugin command execution.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `plugins`: Define deterministic command collision and event-isolation behavior.

## Impact

Touches plugin host/SDK and the compatibility scenario validator only, makes no schema migration and can be removed without data rollback. Pinned evidence SHA is `be800f171172c259d4dd942346e4d247a0783738`; parity uses explicit test doubles.
