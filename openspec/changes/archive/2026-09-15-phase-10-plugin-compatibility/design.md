## Context

The SDK declares facade types but the host is empty. Plugin code must not see graph-db or raw datom mutation.

## Goals / Non-Goals

**Goals:** injected semantic editor/query capabilities, transaction-context events, command registry and error isolation.

**Non-Goals:** plugin sandboxing, UI slots, package loading, or direct database compatibility.

## Decisions

- The host accepts a narrow gateway and never imports graph-db.
- Each event handler is isolated so post-commit failures do not change the completed operation.
- Registry identifiers are unique and immutable until unregistered.
- The parity harness adds a validated `pluginCommand` scenario operation, so candidate and reference providers receive the same command identifier and arguments rather than relying on an unvalidated fixture convention.

## Risks / Trade-offs

- [Legacy APIs exceed target subset] → unsupported calls are absent rather than emulated with raw writes.

## Migration Plan

No persistent migration.
