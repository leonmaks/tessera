## Context

No transport layer currently exposes remote graph operations.

## Goals / Non-Goals

**Goals:** runtime validation, authorization boundary and limits before semantic dispatch.

**Non-Goals:** raw database APIs or E2EE key management.

## Decisions

- The API is transport-neutral and accepts only JSON-sized semantic request objects.
- Missing scopes, unknown operations and raw datoms fail closed.

## Risks / Trade-offs

- [Future endpoints] → each requires explicit scope and validator.
