# Upstream Logseq policy

The project targets behavioral compatibility with a pinned upstream Logseq commit.

## Baseline

`upstream/baseline.json` is the machine-readable source of truth. Run:

```bash
pnpm baseline:pin
```

before starting a compatibility phase. Commit the resulting SHA.

## Source hierarchy

When evidence conflicts, use:

1. executable upstream tests / runtime behavior;
2. source code at the pinned SHA;
3. current source-verified architecture guide;
4. generated/public API contracts;
5. user documentation;
6. legacy documentation.

Record non-obvious conclusions in `docs/source-map.md`.

## Independent implementation rule

Use upstream code to understand behavior, but do not copy or transliterate implementation code. Express the conclusion as a behavior/spec/test first, then implement it independently.
