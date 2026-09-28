## Why

Tessera has a usable local editor and Electron client, but much of the compatibility roadmap remains represented only by isolated package scaffolds or unqualified fixtures. Completing the roadmap turns these pieces into one authoritative graph product with verified parser, properties, query, import, search, plugin, runtime, sync and remote API behavior.

## What Changes

- Finish the remaining roadmap capabilities in dependency order: semantic parsing/references; properties, classes, tasks and journals; full bounded queries; worker/browser integration; import/export/assets; search/projection; plugins; daemon/CLI/backup; sync; remote semantic API hardening.
- Connect existing in-memory scaffolds to semantic graph-worker commands, SQLite persistence, immutable client snapshots and renderer surfaces without creating a second graph authority.
- Complete the working-editor and Electron delivery audits, retaining renderer-local collapse as `TESSERA-LOCAL-COLLAPSE`.
- Add BDD, unit/property, Playwright and actual pinned-upstream differential evidence for every added behavior. Test doubles remain labelled as test doubles and cannot close upstream parity gates.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. The existing 20 main specifications already define the required observable behavior. This implementation-only change sets `skip_specs: true`; any newly discovered contract gap or conflict will be raised as a separate OpenSpec update before code changes.

## Impact

This affects packages, workers, browser/Electron/CLI/HTTP adapters, React UI, storage migrations, test infrastructure, documentation and distribution. Compatibility levels L0 persistence, L1 graph/outliner, L2 parser/properties/tasks, L3 query, L4 plugin, L5 UI, L6 runtime, L7 sync and L8 remote API are in scope. The baseline is `be800f171172c259d4dd942346e4d247a0783738`; each compatibility phase requires independently executable candidate-versus-upstream normalized fixtures and source mapping. Migrations must be versioned, atomic and recoverable; rollback retains user graphs and uses explicit backup/restore rather than destructive replacement.
