## Why

The global strict OpenSpec check is blocked by three editorial validator warnings in established specifications. They prevent completed changes, including the Electron client, from satisfying their global validation gate even though their scoped artifacts are valid.

## What Changes

- Expand the short Purpose text in `outliner` and `tasks-journals` without changing requirements or scenarios.
- Make the existing classes-and-properties normative statement explicit with RFC 2119 wording, retaining its current observable meaning.
- Add focused documentation-validation evidence and retain the existing regression/parity suite.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. This is an editorial/validation-only change; `skip_specs: true` is set because no observable product contract changes.

## Impact

Only the three OpenSpec Markdown files and validation evidence are affected. Compatibility levels, upstream baseline, SQLite schemas, APIs, runtime behavior, migrations, and rollback behavior are unchanged. No upstream differential fixture is required; the relevant evidence is strict OpenSpec validation plus the existing project checks.
