import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, it } from "vitest";
import { inspectPinnedUpstream } from "../../packages/compatibility-oracle/src/index.js";
import { createPropertyTaskJournalWorker } from "../../packages/graph-worker/src/index.js";
import { baseline } from "../support/harness.js";

interface TaskJournalSnapshot { readonly taskTag: boolean; readonly taskStatus: boolean; readonly journalCanonical: boolean; }
const root = resolve(fileURLToPath(new URL("../..", import.meta.url)));

async function candidate(): Promise<TaskJournalSnapshot> {
  const worker = createPropertyTaskJournalWorker(":memory:");
  const first = "00000000-0000-4000-8000-000000000891";
  const second = "00000000-0000-4000-8000-000000000892";
  try {
    const initial = await worker.execute({ kind: "journal.get", operationId: "00000000-0000-4000-8000-000000000893", journal: first, date: "2026-09-20", display: "20 Sep" });
    const repeated = await worker.execute({ kind: "journal.get", operationId: "00000000-0000-4000-8000-000000000894", journal: second, date: "2026-09-20", display: "20 September" });
    await worker.execute({ kind: "task.set", operationId: "00000000-0000-4000-8000-000000000895", task: first, status: "Doing" });
    const entity = await worker.pull(first);
    const canonical = "journal" in initial && "journal" in repeated && initial.journal === repeated.journal;
    const status = entity.status === "found" ? entity.entity.attributes[":task/status"]?.[0] : undefined;
    return { taskTag: status !== undefined, taskStatus: status === "Doing", journalCanonical: canonical };
  } finally { await worker.close(); }
}

function upstream(): TaskJournalSnapshot {
  inspectPinnedUpstream(baseline, resolve(root, ".reference/logseq"));
  const path = `${resolve(root, ".reference/tools/babashka")}${process.platform === "win32" ? ";" : ":"}${process.env.PATH ?? ""}`;
  const output = execFileSync(process.execPath, ["scripts/run-pinned-upstream.mjs", "--", "pnpm", "--dir", "deps/db", "exec", "nbb-logseq", "-cp", "test:script", "script/tessera_phase04_oracle.cljs"], { cwd: root, encoding: "utf8", env: { ...process.env, PATH: path } });
  const snapshot = JSON.parse(output.trim().split(/\r?\n/).at(-1) ?? "{}") as TaskJournalSnapshot;
  return { taskTag: snapshot.taskTag, taskStatus: snapshot.taskStatus, journalCanonical: snapshot.journalCanonical };
}

it("matches pinned DB task and canonical-journal observables", async () => {
  await expect(candidate()).resolves.toEqual(upstream());
}, 30_000);
