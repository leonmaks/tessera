## Context

The graph worker remains the only graph authority; desktop and CLI require a local process boundary without direct database mutation.

## Goals / Non-Goals

**Goals:** exclusive per-graph ownership, typed semantic routing, isolated event delivery and injected consistent backups.

**Non-Goals:** remote sync, raw SQL APIs, or Electron process wiring.

## Decisions

- A runtime registry receives graph lock and health ports; a healthy owner is reused and a stale owner is replaced.
- Invoke delegates only to a semantic command port; backup delegates to a snapshot port rather than copying files.
- Events are notifications after an invoke result and handler errors are isolated.

## Risks / Trade-offs

- [A process dies between checks] → lock acquisition is conditional and health is rechecked before ownership replacement.

## Migration Plan

No graph schema migration; runtime state is disposable and stale locks are recoverable.
