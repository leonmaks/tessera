# Parity fixtures

Store each discrepancy/reproducer as a stable scenario:

```text
<capability>/
  <id>.scenario.json
  <id>.upstream.snapshot.json
  <id>.notes.md
```

Candidate snapshots are generated during tests and normally do not need to be committed unless useful for debugging.

Never normalize away:
- UUID identity;
- parent/page relationships;
- sibling ordering;
- semantic references;
- typed property values;
- task state.

May normalize when explicitly documented:
- internal numeric entity ids;
- transaction ids;
- timestamps not part of observable behavior;
- runtime-specific metadata.
