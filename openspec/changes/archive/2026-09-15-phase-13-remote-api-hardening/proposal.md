## Why

Remote clients need a semantic API boundary that fails closed before reaching graph authority.

## What Changes

- Add scoped semantic API dispatcher with runtime validation, limits and raw-write rejection.

## Capabilities

### New Capabilities
- `remote-semantic-api`: Scoped `/api/v1` semantic dispatch and hardening.

### Modified Capabilities
- None.

## Impact

Adds a transport-neutral API boundary without schema migrations.
