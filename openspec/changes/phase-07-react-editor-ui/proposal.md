## Why

Пользователь ещё не может редактировать дерево блоков через интерфейс, хотя доменные команды и revision-aware store уже существуют. Нужен UI-контракт, который переводит намерения редактора в семантические команды без прямого доступа к графовой БД.

## What Changes

- Add the editor interaction capability: focus/selection, keyboard structural intents, collapsing, multi-selection, and drag/drop intent.
- Add a browser-facing React shell consuming immutable graph-client snapshots and a worker-command port.
- Add Playwright editor scenarios and explicit parity fixtures for targeted interactions.

## Capabilities

### New Capabilities

- `editor-ui`: Observable DB-graph editor interactions and authority boundaries.

### Modified Capabilities

- None.

## Impact

Adds the React/browser app surface and test dependencies, but no persistence migration. All mutations remain semantic worker commands; a rollback removes the UI package without altering stored graphs. Phase affects L5; the pinned SHA is `be800f171172c259d4dd942346e4d247a0783738`, and fixture provenance remains explicit until an executable upstream adapter exists.
