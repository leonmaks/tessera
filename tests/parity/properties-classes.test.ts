import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, it } from "vitest";
import { inspectPinnedUpstream } from "../../packages/compatibility-oracle/src/index.js";
import { createPropertyTaskJournalWorker } from "../../packages/graph-worker/src/index.js";
import { baseline } from "../support/harness.js";

interface Phase04Snapshot { readonly typedNumber: boolean; readonly taskTag: boolean; readonly taskStatus: boolean; readonly journalCanonical: boolean; readonly cycleRejected: boolean; }
const fixture = JSON.parse(readFileSync(new URL("../fixtures/parity/phase04/db-observables.json", import.meta.url), "utf8")) as { readonly date: string; readonly property: { readonly name: string; readonly type: "number"; readonly value: number }; readonly taskStatus: string };
const root = resolve(fileURLToPath(new URL("../..", import.meta.url)));

async function candidate(): Promise<Phase04Snapshot> {
  const worker = createPropertyTaskJournalWorker(":memory:");
  const property = "00000000-0000-4000-8000-000000000871";
  const firstJournal = "00000000-0000-4000-8000-000000000872";
  const secondJournal = "00000000-0000-4000-8000-000000000873";
  const classA = "00000000-0000-4000-8000-000000000874";
  const classB = "00000000-0000-4000-8000-000000000875";
  try {
    await worker.execute({ kind: "property.define", operationId: "00000000-0000-4000-8000-000000000876", uuid: property, name: fixture.property.name, type: fixture.property.type, cardinality: "one" });
    const first = await worker.execute({ kind: "journal.get", operationId: "00000000-0000-4000-8000-000000000877", journal: firstJournal, date: fixture.date, display: "20 Sep" });
    const second = await worker.execute({ kind: "journal.get", operationId: "00000000-0000-4000-8000-000000000878", journal: secondJournal, date: fixture.date, display: "20 September" });
    await worker.execute({ kind: "property.set", operationId: "00000000-0000-4000-8000-000000000879", entity: firstJournal, property, values: [{ type: "number", value: fixture.property.value }] });
    await worker.execute({ kind: "task.set", operationId: "00000000-0000-4000-8000-000000000880", task: firstJournal, status: fixture.taskStatus });
    await worker.execute({ kind: "class.define", operationId: "00000000-0000-4000-8000-000000000881", uuid: classB, name: "B" });
    await worker.execute({ kind: "class.define", operationId: "00000000-0000-4000-8000-000000000882", uuid: classA, name: "A", parents: [classB] });
    const cycleRejected = await worker.execute({ kind: "class.extend", operationId: "00000000-0000-4000-8000-000000000884", child: classB, parent: classA }).then(() => false, () => true);
    const stored = await worker.pull(firstJournal);
    const journal = "journal" in first && "journal" in second && first.journal === second.journal;
    return { typedNumber: stored.status === "found" && stored.entity.attributes[`:property/value/${property}`]?.[0] === fixture.property.value, taskTag: stored.status === "found" && stored.entity.attributes[":task/status"] !== undefined, taskStatus: stored.status === "found" && stored.entity.attributes[":task/status"]?.[0] === fixture.taskStatus, journalCanonical: journal, cycleRejected };
  } finally { await worker.close(); }
}

function upstream(): Phase04Snapshot {
  inspectPinnedUpstream(baseline, resolve(root, ".reference/logseq"));
  const path = `${resolve(root, ".reference/tools/babashka")}${process.platform === "win32" ? ";" : ":"}${process.env.PATH ?? ""}`;
  const output = execFileSync(process.execPath, ["scripts/run-pinned-upstream.mjs", "--", "pnpm", "--dir", "deps/db", "exec", "nbb-logseq", "-cp", "test:script", "script/tessera_phase04_oracle.cljs"], { cwd: root, encoding: "utf8", env: { ...process.env, PATH: path } });
  return JSON.parse(output.trim().split(/\r?\n/).at(-1) ?? "{}") as Phase04Snapshot;
}

it("matches the pinned DB graph's property, task, class and journal observables", async () => {
  await expect(candidate()).resolves.toEqual(upstream());
}, 30_000);
