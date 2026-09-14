## Context

The parser supplies semantic Markdown/Org ASTs but the import-export package is empty. The graph worker remains the only durable graph authority, so this package constructs immutable portable documents rather than performing graph writes.

## Goals / Non-Goals

**Goals:** semantic Markdown/Org conversion, deterministic canonical export, asset metadata separation, and bounded input traversal.

**Non-Goals:** filesystem traversal, raw graph DB mutation, binary asset transfer, or unsupported syntax preservation.

## Decisions

- Convert parser ASTs to an immutable transport document and back, preserving semantic inline node forms. A regex text rewrite was rejected because code/reference semantics would be lost.
- Use explicit character and nesting limits checked during document traversal. On a limit error no partial document is returned.
- Asset links are retained as reference metadata; bytes enter a separate later adapter.

## Risks / Trade-offs

- [Unsupported source formatting] → preserve normalized semantics, not physical whitespace.
- [File graphs differ from DB graphs] → this phase targets the DB semantic document only and records no file-graph authority.

## Migration Plan

There is no persistent migration. The pure conversion API can be rolled back independently.
