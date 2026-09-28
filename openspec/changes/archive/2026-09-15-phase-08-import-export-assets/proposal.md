## Why

Семантический parser не превращает документы в переносимый формат графа и обратно. Фаза добавляет детерминированный импорт/экспорт с явной защитой ресурса, не смешивая его с файловым или UI-авторитетом.

## What Changes

- Add semantic Markdown/Org import and compatible Markdown export for hierarchy, references, tags, properties and task text.
- Add asset metadata/content boundary with stable asset references.
- Add bounded-depth/input handling and round-trip BDD, property and parity corpus.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `import-export`: Add deterministic resource limits and explicit asset-reference treatment to the semantic transport contract.

## Impact

Touches `@tessera-ts/import-export` only; it creates portable in-memory documents and does not write raw facts. No schema migration is required. Baseline SHA is `be800f171172c259d4dd942346e4d247a0783738`; upstream execution is unavailable, so parity uses explicit test-double provenance.
