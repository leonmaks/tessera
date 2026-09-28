import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const baseline = JSON.parse(readFileSync(resolve("upstream/baseline.json"), "utf8"));
if (baseline.status !== "PINNED" || !/^[a-f0-9]{40}$/.test(baseline.commit ?? "")) {
  throw new Error("UNPINNED: upstream/baseline.json must contain an exact pinned SHA");
}

const checkout = resolve(process.env.TESSERA_UPSTREAM_CHECKOUT ?? ".reference/logseq");
if (!existsSync(checkout)) throw new Error(`UPSTREAM_CHECKOUT_MISSING: ${checkout}`);
const actual = execFileSync("git", ["rev-parse", "HEAD"], { cwd: checkout, encoding: "utf8" }).trim();
if (actual !== baseline.commit) throw new Error(`UPSTREAM_CHECKOUT_MISMATCH: expected ${baseline.commit}, got ${actual}`);

const command = process.argv.slice(2).filter((value, index) => !(index === 0 && value === "--"));
if (command.length === 0) {
  console.log(`Pinned upstream checkout verified: ${actual}`);
  console.log("Pass an upstream command after --, for example: pnpm --dir deps/outliner test");
  process.exit(0);
}
const [file, ...args] = command;
const executable = process.platform === "win32" && file === "pnpm" ? "pnpm.cmd" : file;
const result = process.platform === "win32" && executable.endsWith(".cmd")
  ? spawnSync(process.env.ComSpec ?? "cmd.exe", ["/d", "/s", "/c", executable, ...args], { cwd: checkout, stdio: "inherit", shell: false })
  : spawnSync(executable, args, { cwd: checkout, stdio: "inherit", shell: false });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
