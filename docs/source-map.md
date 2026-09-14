# Source map

Maintain this table while implementing parity.

| Capability | Upstream path / evidence | Pinned SHA | Candidate tests | Notes |
|---|---|---:|---|---|
| Worker authority | `docs/agent-guide/implemented/architecture/2026-08-24-logseq-runtime-and-engineering-guide.md` | TBD | render/worker contracts | Worker DB authoritative |
| Plugin types | `libs/src/LSPlugin.ts` | TBD | plugin contract tests | Preserve public observable shapes where targeted |
| DB queries | `libs/guides/db_query_guide.md` | TBD | query parity | DSL + Datalog |
| DB properties | `libs/guides/db_properties_guide.md` | TBD | property parity | First-class property entities |
| Markdown mirror | `docs/logseq-markdown-syntax.md` | TBD | import/export golden tests | Semantic round trip |

## Phase 00 harness evidence

Baseline inspected: `upstream/baseline.json`, commit `be800f171172c259d4dd942346e4d247a0783738`, status `PINNED`. No repinning was performed.

`tests/parity/harness.test.ts` exercises independently authored synthetic providers and `tests/fixtures/parity/harness/canonical.json`. These are harness contract checks, not upstream behavioral parity. There is no local upstream checkout. An attempt to inspect `libs/src/LSPlugin.ts` at the pinned SHA through the web reader failed to fetch; no upstream source behavior was inferred from that attempt. The earlier TBD rows remain unverified and must be resolved during their behavioral phases.

Repository integration evidence: the installed Cucumber 13.2.1 loader (`lib/configuration/from_file.js`) reads an ESM default export as the default profile. The bootstrap's nested default object discovered zero scenarios. `tests/unit/bdd-config.test.ts` permanently reproduces detection through the real configuration API; after correction seven Phase 00 scenarios execute.
