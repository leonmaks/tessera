## Context

See `proposal.md`. Graph DB exposes authoritative post-commit reports, while the graph worker currently contains contracts only and graph-client is empty. The renderer must never acquire a mutable graph copy.

## Goals / Non-Goals

**Goals:**

- Provide typed message-port adapters and an in-process worker boundary for semantic commands and read queries.
- Derive frozen deltas only after graph commits and apply them to a frozen external cache by revision.

**Non-Goals:**

- Implement React components, persistence migrations, or arbitrary remote RPC transports.
- Treat command result payloads as a second graph publication channel.

## Decisions

- The worker delegates mutation through an injected semantic command handler; it does not expose `GraphDatabase.transact` to clients. This preserves authority and supports later outliner/property handlers. Direct DB RPC was rejected because it violates the architecture contract.
- A worker subscription is derived from post-commit reports. The adapter serializes typed request/response/event envelopes over any `MessagePort`-shaped endpoint, which works in browsers and Node without platform-specific graph logic.
- The client store accepts only strictly newer deltas. A mismatched children base revision records the resource as stale and calls an injected reload callback; it does not merge guessed membership.
- Command results have no `delta`; observers apply only subscribed events. This prevents duplicate publication.

## Risks / Trade-offs

- [The first command handler supports a bounded semantic subset] → keep the interface exhaustive at its boundary and add handlers as later domain phases arrive.
- [Message ports can deliver malformed payloads] → validate envelope shape and reject unknown operation names before dispatch.

## Migration Plan

No durable schema or wire migration is required. Clients opt into the adapters; rollback removes that opt-in and leaves graph state intact.
