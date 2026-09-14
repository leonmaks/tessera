## Context

The query-engine package is a scaffold. Query evaluation must be a pure read model over UUID-addressed EAV facts and never become a SQL-only public replacement.

## Goals / Non-Goals

**Goals:** bounded Datalog variable unification, logical clauses, pull and deterministic simple task query compilation.

**Non-Goals:** arbitrary host-language predicates, unbounded recursion, and graph mutation.

## Decisions

- Parse a restricted EDN-like array input at the API boundary and evaluate clauses against immutable facts.
- Carry environments as maps, use structural equality for bindings, canonical-sort output rows, and meter candidate expansions.
- Implement pull against entity attribute maps and expose predicates/aggregates/rules only after their fixtures establish normalization.

## Risks / Trade-offs

- [Broad query syntax] → reject unsupported grammar explicitly instead of silently filtering in JS.
- [Resource amplification] → default step/result caps fail closed.

## Migration Plan

No migration; the package is a pure read service.
