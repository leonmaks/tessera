## Why

Offline graph edits require ordered semantic synchronization without exposing raw datom writes or treating presence as durable state.

## What Changes

- Add ordered sync server/client protocol with stale rejection, pull/rebase/retry, presence, checksums and partial-success reporting.

## Capabilities

### New Capabilities
- `rtc-sync`: Ordered local synchronization runtime.

### Modified Capabilities
- `sync`: Define hello, pull, batch and recovery compatibility behavior.

## Impact

Touches sync protocol, client and server packages; no destructive migration. Pinned baseline is recorded and fixtures use explicit test doubles until upstream execution is available.
