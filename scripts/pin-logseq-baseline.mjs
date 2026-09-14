import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const path = resolve("upstream/baseline.json");
const baseline = JSON.parse(readFileSync(path, "utf8"));
const repo = process.env.LOGSEQ_REFERENCE_REPO || baseline.repository;
const branch = process.env.LOGSEQ_REFERENCE_BRANCH || baseline.branch || "master";

try {
  const output = execFileSync("git", ["ls-remote", repo, `refs/heads/${branch}`], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  }).trim();

  const sha = output.split(/\s+/)[0];
  if (!/^[a-f0-9]{40}$/i.test(sha ?? "")) {
    throw new Error(`Unexpected ls-remote output: ${output}`);
  }

  baseline.branch = branch;
  baseline.commit = sha;
  baseline.resolvedAt = new Date().toISOString();
  baseline.status = "PINNED";
  writeFileSync(path, JSON.stringify(baseline, null, 2) + "\n");
  console.log(`Pinned Logseq ${branch} at ${sha}`);
} catch (error) {
  console.error("Could not pin upstream Logseq baseline.");
  console.error(String(error?.message ?? error));
  console.error("The repository remains usable, but parity claims require a pinned SHA.");
  process.exitCode = 2;
}
