## 1. Baseline and editorial validation

- [x] 1.1 Record the three existing strict-validator failures and confirm that no executable BDD, TDD/property, or parity scenario is applicable because the change has no observable runtime behavior. Verify with `pnpm exec openspec validate --all --strict`.
- [x] 1.2 Make only the planned Purpose and normative-wording edits in the three main specifications, preserving every requirement name and scenario. Verify with `pnpm exec openspec validate outliner --type spec --strict`, `pnpm exec openspec validate properties-classes --type spec --strict`, and `pnpm exec openspec validate tasks-journals --type spec --strict`.

## 2. Full verification and handoff

- [x] 2.1 Run the complete documentation and regression qualification, recording that parity needs no new fixture because the compatibility contract is unchanged. Verify with `pnpm exec openspec validate --all --strict`, `pnpm check:specs`, `pnpm test:parity`, and `pnpm verify`.
- [x] 2.2 Re-audit the Electron change's formerly blocked global validation gate without archiving either change unless each change's own exit criteria and archive guidance are met. Verify with `pnpm exec openspec validate electron-desktop-client --strict`, `pnpm exec openspec status --change electron-desktop-client`, and `pnpm exec openspec status --change fix-global-spec-validation`.
