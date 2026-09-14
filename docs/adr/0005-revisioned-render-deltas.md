# ADR-0005 — Revision-aware immutable render deltas

Status: Accepted

Each committed graph transaction advances a monotonic revision. The worker derives one delta containing replacements, tombstones, ordered children patches and affected resource keys. Stale child patches trigger reload.
