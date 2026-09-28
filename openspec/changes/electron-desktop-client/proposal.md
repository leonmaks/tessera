## Why

Tessera has a working web editor but no native desktop client. Users need a Windows application that launches its own local runtime, opens notes without manually starting Vite, and preserves data across restarts.

## What Changes

- Add an Electron window hosting the existing React editor and a production local graph host, independent of Vite and an externally installed Node runtime.
- Keep semantic worker commands, immutable snapshots, SQLite persistence and the accepted renderer-local collapse behavior.
- Provide single-instance activation, protected window navigation, safe shutdown with unsaved-change handling, native Markdown save flow and visible startup/runtime errors.
- Add reproducible development/build commands and an unsigned Windows x64 distributable with packaged launch/reopen tests.
- Keep the browser development workflow working; do not silently move or replace existing web graphs.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `desktop-cli-runtime`: independently launchable Electron editor, isolated desktop window, native lifecycle, persistent desktop data location and distributable acceptance criteria.

## Impact

Targets `apps/desktop`, existing web UI, reusable local host/worker entry points, build scripts, root dependencies and Electron-specific tests. The existing `scripts/editor-host.ts` is Vite-coupled and its worker loads TypeScript through tsx; packaging requires compiled worker resources and a host independent of Vite. The current runtime registry is an injected in-memory abstraction, not an already-running production daemon.

Compatibility scope: L0 persistence/ownership and L5 editor behavior, with the accepted `TESSERA-LOCAL-COLLAPSE` deviation retained. Baseline remains `be800f171172c259d4dd942346e4d247a0783738`. Existing runtime/outliner/editor regressions and independent desktop-vs-web normalized scenario comparisons are required. Upstream's own passing outliner tests are not differential desktop parity; no blanket phase-completion claim is made.

No graph schema migration. Desktop defaults to an application-user-data graph; an explicit graph-path override can open an existing graph under the same writer lock. No automatic import, copy or deletion of `.tessera/graph.sqlite`. Rollback leaves data intact. Windows is the verified target of this workspace; macOS/Linux packaging, code signing, automatic updates, cloud sync and a full public CLI daemon redesign are outside this client change.
