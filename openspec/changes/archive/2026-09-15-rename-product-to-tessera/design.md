## Context

Internal packages use the `@tessera-ts` scope while the upstream application remains the compatibility oracle.

## Goals / Non-Goals

**Goals:** rename Tessera-owned identifiers and preserve valid upstream evidence.

**Non-Goals:** alter upstream URLs, baseline repository identity, or compatibility claims.

## Decisions

- Replace the internal `@tessera-ts` scope, candidate names, and product-facing titles with Tessera equivalents.
- Keep all references that name the real upstream app, its behavior, or its source repository.

## Risks / Trade-offs

- [A stale alias breaks an import] → typecheck and complete test suite verify the rename.
