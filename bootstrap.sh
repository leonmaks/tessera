#!/usr/bin/env bash
set -euo pipefail
corepack enable
pnpm install
pnpm bootstrap
printf '\nOpen codex/START.md and start Phase 00.\n'
