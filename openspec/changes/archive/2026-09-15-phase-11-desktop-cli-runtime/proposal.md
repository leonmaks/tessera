## Why

Desktop and CLI clients need one durable graph owner per graph, with a recoverable local control plane and safe backups.

## What Changes

- Add a graph-bound daemon, exclusive graph lock, semantic invoke/event routes and CLI client.
- Add health, shutdown, stale-daemon recovery and SQLite-consistent backup contracts.

## Capabilities

### New Capabilities
- `desktop-cli-runtime`: Local daemon lifecycle, semantic control routes and backup behavior.

### Modified Capabilities
- `runtime-persistence`: Define daemon ownership, recovery and backup behavior.

## Impact

Adds desktop/CLI runtime packages and tests; no graph-schema migration. Baseline `be800f171172c259d4dd942346e4d247a0783738` is inspected and parity will use a declared test double until a runnable upstream daemon adapter exists.
