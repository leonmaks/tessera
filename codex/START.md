# Start here in Codex

## One-time repository setup

Run:

```bash
corepack enable
pnpm install
pnpm bootstrap
```

Read:
- `AGENTS.md`
- `docs/IMPLEMENTATION-ROADMAP.md`
- `openspec/config.yaml`
- `upstream/baseline.json`

If the baseline is `UNPINNED`, run `pnpm baseline:pin`.

## First Codex request

Use this instruction:

> Work on Phase 00 from `docs/IMPLEMENTATION-ROADMAP.md`. Follow `AGENTS.md` exactly. First inspect the current OpenSpec state and create the Phase 00 OpenSpec change using the Codex OpenSpec skill. Do not implement production behavior before the proposal/spec/design/tasks are coherent. Then execute BDD/TDD in red-green-refactor order. Finish only when Phase 00 exit commands pass and the change is ready to sync/archive.

For subsequent phases replace `Phase 00` with the next phase.

## OpenSpec commands in Codex

Current OpenSpec uses skills for Codex. Typical names are:

```text
$openspec-propose
$openspec-explore
$openspec-apply-change
$openspec-update-change
$openspec-sync-specs
$openspec-archive-change
```

Use the actual skill names installed into `.agents/skills/` by `openspec init/update`.

## Autonomous phase prompt

If you want Codex to carry a phase through implementation in one session:

> Implement Phase NN according to `docs/IMPLEMENTATION-ROADMAP.md` and `AGENTS.md`. Use OpenSpec artifacts as the source of truth. Create/update the change, add observable Gherkin scenarios, make focused tests fail first, implement independently in TypeScript, add parity fixtures, run all phase exit checks and `pnpm verify`. Do not weaken tests or bypass semantic command boundaries. If upstream behavior is ambiguous, record the evidence and choose executable behavior from the pinned baseline.

## Important

Do not ask Codex to "clone Logseq". Ask it to implement one phase/capability at a time. This keeps the OpenSpec change, tests, source map and parity evidence reviewable.
