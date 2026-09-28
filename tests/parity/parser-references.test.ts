import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, it } from "vitest";
import { runParity } from "../../packages/compatibility-oracle/src/index.js";
import type { CanonicalSnapshot, CompatibilityScenario, ParityProvider, ReferenceProvider } from "../../packages/compatibility-oracle/src/index.js";
import { createParser } from "../../packages/parser/src/index.js";
import { extractReferences } from "../../packages/references/src/index.js";
import { baseline, sha } from "../support/harness.js";

const scenario = JSON.parse(readFileSync(new URL("../fixtures/parity/parser/page-and-code.scenario.json", import.meta.url), "utf8")) as CompatibilityScenario;
const candidate: ParityProvider = { name: "phase03-parser-candidate", async execute(input) { const command = input.commands[0]; if (!command || command.op !== "updateBlock") throw new Error("Parser fixture requires updateBlock"); const refs = extractReferences(createParser().parseMarkdown(command.content).blocks[0]!.inline); return { graphLabel: input.id, nodes: refs.pages.map((content, index) => ({ uuid: `00000000-0000-4000-8000-${(381 + index).toString().padStart(12, "0")}`, kind: "page-ref", content, tags: [], refs: [], properties: {} })) }; } };
const root = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const checkout = resolve(root, ".reference/logseq");
const oracle = resolve(checkout, "deps/graph-parser/script/tessera_parser_oracle.cljs");
const reference: ReferenceProvider = { name: "pinned-logseq-graph-parser", baselineCommit: sha, evidence: "upstream-execution", async execute(input) {
  if (!existsSync(oracle)) throw new Error("UPSTREAM_PARSER_ORACLE_MISSING");
  const command = input.commands[0]; if (!command || command.op !== "updateBlock") throw new Error("Parser fixture requires updateBlock");
  const encoded = Buffer.from(JSON.stringify({ content: command.content, format: "markdown" })).toString("base64");
  const path = `${resolve(root, ".reference/tools/babashka")}${process.platform === "win32" ? ";" : ":"}${process.env.PATH ?? ""}`;
  const output = execFileSync(process.execPath, ["scripts/run-pinned-upstream.mjs", "--", "pnpm", "--dir", "deps/graph-parser", "exec", "nbb-logseq", "-cp", "src", "script/tessera_parser_oracle.cljs", encoded], { cwd: root, encoding: "utf8", env: { ...process.env, PATH: path } });
  const ast = JSON.parse(output.trim().split(/\r?\n/).at(-1) ?? "[]") as readonly unknown[];
  const pages = ast.flatMap(node => Array.isArray(node) && node[0] === "Link" && node[1] && typeof node[1] === "object" && Array.isArray((node[1] as { url?: unknown }).url) && (node[1] as { url: unknown[] }).url[0] === "Page_ref" ? [String((node[1] as { url: unknown[] }).url[1])] : []);
  return { graphLabel: input.id, nodes: pages.map((content, index) => ({ uuid: `00000000-0000-4000-8000-${(381 + index).toString().padStart(12, "0")}`, kind: "page-ref", content, tags: [], refs: [], properties: {} })) };
} };
it("executes the same parser fixture against the pinned upstream provider", async () => { await expect(runParity(baseline, scenario, candidate, reference)).resolves.toMatchObject({ equal: true, evidence: "upstream-execution", compatible: true }); }, 30_000);
