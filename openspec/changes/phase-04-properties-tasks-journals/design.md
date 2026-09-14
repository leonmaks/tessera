## Context

Properties has only declaration types; tasks has no implementation and journals has no package. These semantic models must not establish a second graph authority, so they remain pure services and accept only UUID-labelled domain values.

## Goals / Non-Goals

**Goals:** typed validation, class DAG/effective definitions, deterministic tasks and canonical journals.

**Non-Goals:** SQLite persistence adapters, parser property syntax, UI rendering, and advanced recurrence expressions beyond daily.

## Decisions

- Property definitions and assignments are held in a service-owned immutable snapshot with runtime validation; `one` replaces a value while `many` deduplicates typed values.
- A class graph is traversed with a visiting set; cycles throw before mutating its edge set.
- Tasks have explicit typed status/schedule fields; completing a daily repeat advances schedule and resets status in one immutable replacement.
- Journals use ISO `YYYY-MM-DD` as identity key and a UUID factory only for first creation.

## Risks / Trade-offs

- [No upstream executable adapter] → fixtures retain `compatible: false` provenance.
- [Service is not yet DB-backed] → Phase 06 graph-worker adapter will make its mutations graph transactions; this phase exposes no raw graph mutation API.

## Migration Plan

No persistent schema change; rollback is code-only.
