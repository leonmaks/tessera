## Context

Existing protocol shapes define messages but not an ordered runtime.

## Goals / Non-Goals

**Goals:** monotonic server positions, stale recovery, ephemeral presence and normalized checksums.

**Non-Goals:** raw datom remote mutation and E2EE transport.

## Decisions

- Server accepts semantic transaction payloads only at the current position; stale clients pull then retry.
- Presence is held in memory and omitted from transaction logs.

## Risks / Trade-offs

- [Partial batch failure] → preserve prefix order and report the applied prefix.
