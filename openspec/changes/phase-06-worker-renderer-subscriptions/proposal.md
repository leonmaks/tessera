## Why

Рендерер пока не имеет ревизионного канала к единственному авторитетному состоянию графа. Нужен наблюдаемый контракт, при котором успешно зафиксированная операция публикуется ровно один раз, а устаревшие патчи безопасно перезагружаются.

## What Changes

- Add a typed worker command/query boundary over the authoritative graph adapter.
- Add an immutable revision-aware external renderer store and deterministic render-delta construction.
- Add browser and Node message-port adapters without granting either renderer authority over graph data.
- Cover stale revisions, tombstones, child-patch reload, and duplicate publication with BDD, unit/property, and parity fixtures.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `render-subscriptions`: Add observable single-publication and immutable-store behavior to revision-aware render delivery.

## Impact

Affected packages are `@logseq-ts/graph-worker` and `@logseq-ts/graph-client`; no persistence migration occurs. The local RPC protocol is additive and can be rolled back by stopping clients from using its adapters. Evidence is pinned baseline `be800f171172c259d4dd942346e4d247a0783738`; executable upstream worker parity remains unavailable, so fixtures state `test-double` provenance.
