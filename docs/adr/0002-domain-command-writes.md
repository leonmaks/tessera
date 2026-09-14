# ADR-0002 — Semantic commands are the only write API

Status: Accepted

Graph changes are expressed as validated domain commands (`InsertBlock`, `MoveBlock`, `SetProperty`, etc.). Raw SQLite/datoms are storage details and are not accepted from UI, plugins, CLI, sync or remote semantic APIs.
