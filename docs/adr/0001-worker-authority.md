# ADR-0001 — Worker-owned graph authority

Status: Accepted

The graph worker owns the only mutable authoritative graph state. Renderers and application clients retain only UI state plus immutable graph projections.

Consequences:
- all mutations cross the worker command boundary;
- renderer caches are replaceable projections;
- no optimistic mutable shadow block tree;
- CLI, plugins, sync and HTTP semantic APIs reuse the same command path.
