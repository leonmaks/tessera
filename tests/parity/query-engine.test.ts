import { execFileSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, it } from "vitest";
import { runParity } from "../../packages/compatibility-oracle/src/index.js";
import type { CompatibilityScenario, ParityProvider, ReferenceProvider } from "../../packages/compatibility-oracle/src/index.js";
import { createQueryEngine } from "../../packages/query-engine/src/index.js";
import { baseline, sha } from "../support/harness.js";

const root = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const scenario: CompatibilityScenario = { id: "query-basic-title-predicate", description: "Datalog predicate selects a single persisted block title", commands: [{ op: "createPage", name: "Query fixture" }] };
const snapshot = (rows: readonly string[]) => ({ graphLabel: scenario.id, nodes: [{ uuid: "00000000-0000-4000-8000-000000000501", kind: "query-result", content: "titles", tags: [], refs: [], properties: { rows } }] });
const query = '[:find ?title :where [?b :block/title ?title] [(= ?title "alpha task")]]';
const fixture = resolve(root, "tests/fixtures/parity/query/basic.edn");
const classpath = process.platform === "win32" ? "src;../outliner/src;script" : "src:../outliner/src:script";
const nodeOptions = `--require=${resolve(root, "scripts/windows-user-info-shim.cjs")}`;

function upstreamCommand(args: readonly string[]): string {
  return execFileSync(process.execPath, ["scripts/run-pinned-upstream.mjs", "--", "pnpm", "--dir", "deps/db", "exec", "nbb-logseq", "-cp", classpath, ...args], { cwd: root, encoding: "utf8", env: { ...process.env, NODE_OPTIONS: nodeOptions } });
}

const candidate: ParityProvider = { name: "phase05-query-candidate", async execute() {
  const rows = await createQueryEngine({ facts: [{ entity: "alpha", attribute: ":block/title", value: "alpha task" }, { entity: "beta", attribute: ":block/title", value: "beta task" }] }).datalog(query);
  if (!Array.isArray(rows) || !rows.every(Array.isArray)) throw new Error("Candidate Datalog result is not tabular");
  return snapshot(rows.map(row => String(row[0])));
} };
const reference: ReferenceProvider = { name: "pinned-logseq-datascript-query-cli", baselineCommit: sha, evidence: "upstream-execution", async execute() {
  const graph = join(mkdtempSync(join(tmpdir(), "tessera-query-oracle-")), "graph.sqlite");
  upstreamCommand(["script/create_graph.cljs", graph, fixture]);
  const output = upstreamCommand(["script/query.cljs", graph, query, "--raw"]);
  return snapshot(JSON.parse(output.trim().split(/\r?\n/).at(-1) ?? "[]") as string[]);
} };
it("matches a pinned upstream Datascript query over a persisted fixture", async () => {
  await expect(runParity(baseline, scenario, candidate, reference)).resolves.toMatchObject({ equal: true, compatible: true, evidence: "upstream-execution" });
}, 30_000);
