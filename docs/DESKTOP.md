# Tessera desktop (Windows x64)

## Run

From the repository: `pnpm install`, then `pnpm dev:desktop`.
This builds local resources and opens Electron; no Vite server is required.

For distribution: `pnpm package:desktop` produces:

- `dist/releases/Tessera-win32-x64/Tessera.exe`
- `dist/releases/Tessera-win32-x64.zip`

Extract the entire ZIP before running `Tessera.exe`; the EXE needs its neighboring Electron resources. The distribution contains its own Node/Chromium runtime and works offline. It is unsigned, has no installer or automatic updater, and Windows may display an unsigned-app warning. Only Windows x64 is qualified here. Packaging uses Windows `tar.exe`; it reuses the Electron cache only after checking the archive against the installed package's SHA-256 checksum.

## Data and editing

Desktop defaults to Electron's user-data directory, normally `%APPDATA%/Tessera/graphs/default/graph.sqlite`. Use **Файл → Расположение данных** for the actual path. `TESSERA_GRAPH_PATH` explicitly selects another graph; `TESSERA_USER_DATA` selects a separate application profile (useful for testing). Relative graph overrides resolve against the launch directory, so prefer absolute paths. Default data is independent of launch directory.

Existing `.tessera/graph.sqlite` web notes are not automatically copied, moved or deleted. A live compatible host for an explicitly selected graph is reused; legacy live PID locks fail safely. Do not delete a lock to bypass a running owner. A second launch of the same desktop profile focuses the original window.

Create pages in the left sidebar. Enter splits blocks; Tab/Shift+Tab changes nesting; the bullet selects or drags blocks; undo/redo groups semantic operations. Collapse is local interface state, persisted under the stable desktop origin, and does not commit a graph transaction. Markdown export opens a native save destination dialog. Closing with drafts offers Save, Cancel or explicit Discard. A failed save leaves drafts available in the live window. This is not crash-proof draft storage: only acknowledged graph commits are guaranteed after a crash.

Application rollback/replacement leaves the user-data directory and any explicit graph path intact. No schema migration is introduced. Build/package commands replace only disposable output under `dist`, never graph data. Do not copy a live SQLite file as a backup; use a SQLite-consistent backup capability.

## Verification

`pnpm build:desktop` builds main, sandboxed preload, graph worker and shared web resources.
`pnpm package:desktop` creates the Windows folder and ZIP.
`pnpm test:desktop` runs Playwright Electron tests against built and packaged resources; build/package first.
`pnpm test:bdd` includes native acceptance scenarios and builds/packages their inputs once.
`pnpm test:e2e`, `pnpm test:parity`, and `pnpm verify` retain the web, compatibility-fixture and static/unit gates.

Tests use temporary profiles and graphs, not the default user graph. Native save/close dialog choices are supplied by the test driver; actual renderer, Electron, transport, worker and SQLite remain live. Synthetic failing workers are transport-failure fixtures, not parity oracles. Cross-shell tests compare independent web/Electron graphs but do not establish upstream Logseq equivalence. Full CLI/daemon route qualification, consistent-backup qualification and true pinned-upstream differential parity remain separate gates; this client is not a claim that all roadmap phases are complete.
