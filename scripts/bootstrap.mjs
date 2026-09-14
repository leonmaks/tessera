import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";

function run(cmd, args, options = {}) {
  console.log(`> ${cmd} ${args.join(" ")}`);
  return execFileSync(cmd, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
    ...options
  });
}

run("node", ["--version"]);
run("pnpm", ["--version"]);

if (!existsSync("openspec/config.yaml")) {
  throw new Error("openspec/config.yaml is missing");
}

const codexSkill = ".agents/skills/openspec-propose/SKILL.md";
try {
  if (!existsSync(codexSkill)) {
    run("pnpm", ["exec", "openspec", "init", ".", "--tools", "codex", "--force"]);
  } else {
    run("pnpm", ["exec", "openspec", "update"]);
  }
} catch {
  console.warn(
    "OpenSpec Codex integration could not complete. Run manually: pnpm exec openspec init . --tools codex"
  );
}

run("node", ["scripts/check-specs.mjs"]);
run("node", ["scripts/check-boundaries.mjs"]);

try {
  run("node", ["scripts/pin-logseq-baseline.mjs"]);
} catch {
  console.warn(
    "Upstream baseline was not pinned (network/git unavailable). Run `pnpm baseline:pin` later."
  );
}

console.log("\nBootstrap complete.");
console.log("Next: open codex/START.md and begin Phase 00.");
