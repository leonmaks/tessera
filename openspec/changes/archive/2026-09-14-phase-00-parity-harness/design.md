## Context

See proposal.md. Existing ports and provider interfaces are stubs; the boundary checker searches whole source text. Phase 00 introduces no graph mutations.

## Goals / Non-Goals

Provide an executable harness contract. Do not implement a substitute graph engine or label test doubles as upstream execution. DB/file semantics remain unchanged.

## Decisions

- Validate with existing Zod dependency and strict snapshot objects. Adapters project internal storage metadata; the harness never guesses which unknown fields can be discarded.
- Canonicalize recursively, sorting sets and object keys but preserving arrays and opaque ordering tokens. Compare canonical JSON and retain both snapshots in reports.
- Keep ParityProvider as the base interface and add ReferenceProvider provenance. Pass cloned scenarios to prevent one adapter mutating another's inputs. Errors propagate; no retries or cached success.
- Platform sequence ports implement existing interfaces without IO. Exhaustion is explicit, avoiding accidental fallback to random/time sources.
- Cucumber 13 loads the ESM default export as the default profile directly. Remove the bootstrap configuration's extra default nesting; a regression test must discover all seven Phase 00 scenarios through the real configuration loader.
- Parse imports using the installed TypeScript parser. Resolve relative targets for boundary enforcement; ignore comments and string contents outside import expressions. Keep checks independent of runtime graph packages.
- Dependency direction remains apps -> graph-client -> domain services -> graph-worker -> graph-db/platform. Harness imports no graph-db; it owns no graph state. There is no transaction, revision or distributed retry path in this phase.

## Risks / Trade-offs

- Test-double equality could be mistaken for compatibility -> explicit evidence kind and compatibility flag.
- No executable Logseq adapter yet -> only harness contracts pass in Phase 00; real behavioral parity starts with graph implementation.
- Working directory has no .git -> do not claim committed evidence or archive until the repository's commit prerequisite can be met.

## Migration Plan

No storage or network changes. Additive harness APIs; revert these files to roll back tooling.
