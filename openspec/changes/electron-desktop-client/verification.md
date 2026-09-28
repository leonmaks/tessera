# Electron client verification

Implementation and verification performed on Windows x64, 2026-09-15/16. Electron 44.4.0; pinned upstream baseline remains `be800f171172c259d4dd942346e4d247a0783738`.

## Delivered

- Native isolated Electron window over the existing React editor and semantic graph client.
- Shared authenticated loopback host, graph ownership/reuse and compiled SQLite worker; Vite remains an adapter.
- Stable user-data graph, explicit graph override, single-instance activation and visible startup failures.
- Save/Cancel/Discard closing, preserved failed drafts, title-draft saving, native Markdown destination/cancel.
- Windows x64 folder and ZIP; instructions in `docs/DESKTOP.md`.

Artifacts: `dist/releases/Tessera-win32-x64/Tessera.exe`, `dist/releases/Tessera-win32-x64.zip` (approximately 159 MB), inspected screenshot `.tmp/tessera-electron.png`. Extract the entire distribution, not the EXE alone. Unsigned; no installer/signing/updates claimed.

## Recorded verification

| Command | Result |
| --- | --- |
| `pnpm exec vitest run tests/unit/desktop-host.test.ts tests/property/desktop-host.test.ts tests/unit/desktop-lifecycle.test.ts` | 13 tests passed, including 500 generated asset paths |
| `pnpm test:bdd` | 57 scenarios, 206 steps passed; native scenarios build/package and run real Electron acceptance drivers |
| `pnpm test:desktop` | 10 tests passed; the final BDD run also re-exercised these drivers on the rebuilt distribution |
| `pnpm test:e2e` | 9 browser tests passed after host extraction |
| `pnpm verify` | Boundaries, spec inventory, strict TypeScript and 112 tests in 51 files passed |
| `pnpm test:parity` | 32 existing fixture tests in 14 files passed; see qualification limits below |
| `pnpm build:web` | Passed |
| `pnpm build:desktop` | Passed; also run by native BDD preparation |
| `pnpm package:desktop` | Passed; native BDD preparation subsequently repeated the same build/package scripts |
| `pnpm exec openspec validate electron-desktop-client --strict` | Passed |
| `pnpm exec openspec validate --all --strict` | 19 items passed, 3 pre-existing spec warnings failed strict validation |

The packaged test launches a copied distribution from a path containing spaces, from a different working directory with no Node in PATH, blocks remote access, writes nested blocks and checks exact UUIDs/content/revision after process restart. It verifies local collapse survives without a graph revision. Second-process activation and existing external-host reuse are separately exercised. Export tests use native download handling with test-selected destinations/cancellation. Close dialog choices are supplied by the driver; renderer, host, worker and SQLite remain real.

## Regression evidence

Initial desktop host/policy tests and BDD failed on missing implementation modules. The initial actual Electron launch test failed before the compiled main/worker existed. Focused suites passed after implementation. A native-export policy assertion failed before its helper was implemented. Property testing found `".. "` (seed `1707307868`, path `361:14:12`); asset routing now rejects dot-dot-prefixed segments, and explicit permanent cases cover this Windows path edge. Worker protocol fixtures cover malformed replies, unavailable entries, crashes and missing replies; these are deliberately synthetic fault injection, not upstream reference evidence.

## Exit audit and explicit limits

Scoped desktop persistence, one-writer/reuse, dead-owner recovery, renderer isolation, close/export, offline packaging and cross-shell editor checks pass. The worker remains the only mutable SQLite authority. No graph schema migration, user graph copying or collapse transaction was introduced. `TESSERA-LOCAL-COLLAPSE` remains the accepted product decision.

Cross-shell normalized snapshots and Markdown output match for edit/split/indent/history/move/search/collapse/export. This compares Tessera web with Tessera desktop, not Tessera against executable upstream Logseq. Existing parity fixtures are not newly qualified pinned-upstream differential evidence. This change does not establish all Phase 11 backup/CLI routes, all Phase 07 browser-worker deliverables, or global roadmap completion.

Global strict OpenSpec validation still reports:

- `outliner`: Purpose text shorter than the validator threshold.
- `properties-classes`: existing “Tags/classes may define properties” requirement lacks SHALL/MUST.
- `tasks-journals`: Purpose text shorter than the validator threshold.

The user explicitly chose to leave these for a separate task. They were not edited. Task 5.2 remains open because the global gate is not green; this change is not synchronized or archived. No commits were created, and pre-existing workspace edits were preserved.
