import { expect, it } from "vitest";
import { createPropertyTaskJournalWorker } from "../../packages/graph-worker/src/index.js";

const property = "00000000-0000-4000-8000-000000000801";
const journal = "00000000-0000-4000-8000-000000000802";
const person = "00000000-0000-4000-8000-000000000808";
const employee = "00000000-0000-4000-8000-000000000812";

it("commits typed property and journal facts through one worker-owned authority", async () => {
  const worker = createPropertyTaskJournalWorker(":memory:");
  try {
    await worker.execute({ kind: "property.define", operationId: "00000000-0000-4000-8000-000000000803", uuid: property, name: "rating", type: "number", cardinality: "one" });
    await worker.execute({ kind: "journal.get", operationId: "00000000-0000-4000-8000-000000000804", journal, date: "2026-09-16", display: "16 Sep" });
    await worker.execute({ kind: "property.set", operationId: "00000000-0000-4000-8000-000000000805", entity: journal, property, values: [{ type: "number", value: 5 }] });
    await worker.execute({ kind: "class.define", operationId: "00000000-0000-4000-8000-000000000809", uuid: person, name: "Person", properties: [property] });
    await worker.execute({ kind: "class.assign", operationId: "00000000-0000-4000-8000-000000000810", entity: journal, class: person });
    await worker.execute({ kind: "class.define", operationId: "00000000-0000-4000-8000-000000000813", uuid: employee, name: "Employee", parents: [person] });
    await worker.execute({ kind: "task.set", operationId: "00000000-0000-4000-8000-000000000806", task: journal, status: "Doing", scheduled: "2026-09-16", repeat: "daily" });
    await worker.execute({ kind: "task.complete", operationId: "00000000-0000-4000-8000-000000000807", task: journal, scheduled: "2026-09-16", repeat: "daily" });
    await expect(worker.pull(journal)).resolves.toMatchObject({ status: "found", entity: { attributes: { ":journal/date": ["2026-09-16"], [`:property/value/${property}`]: [5], ":task/status": ["Todo"], ":task/scheduled": ["2026-09-17"] } } });
    expect(await worker.effectiveProperties(journal)).toEqual([property]);
    await expect(worker.execute({ kind: "class.extend", operationId: "00000000-0000-4000-8000-000000000814", child: person, parent: employee })).rejects.toThrow("CLASS_CYCLE");
    await expect(worker.execute({ kind: "journal.get", operationId: "00000000-0000-4000-8000-000000000811", journal, date: "2026-09-16", display: "changed" })).resolves.toMatchObject({ datoms: [] });
  } finally { await worker.close(); }
});

it("uses the journal day as durable identity and validates typed property writes", async () => {
  const worker = createPropertyTaskJournalWorker(":memory:");
  const firstJournal = "00000000-0000-4000-8000-000000000821";
  const secondJournal = "00000000-0000-4000-8000-000000000822";
  const rating = "00000000-0000-4000-8000-000000000823";
  try {
    await worker.execute({ kind: "property.define", operationId: "00000000-0000-4000-8000-000000000824", uuid: rating, name: "rating", type: "number", cardinality: "one" });
    const created = await worker.execute({ kind: "journal.get", operationId: "00000000-0000-4000-8000-000000000825", journal: firstJournal, date: "2026-09-17", display: "17 Sep" });
    await expect(worker.execute({ kind: "journal.get", operationId: "00000000-0000-4000-8000-000000000825", journal: firstJournal, date: "2026-09-17", display: "17 Sep" })).resolves.toEqual(created);
    const repeated = await worker.execute({ kind: "journal.get", operationId: "00000000-0000-4000-8000-000000000826", journal: secondJournal, date: "2026-09-17", display: "Different label" });
    expect(created).toMatchObject({ journal: firstJournal });
    expect(repeated).toEqual({ operationId: "00000000-0000-4000-8000-000000000826", revision: 2, datoms: [], journal: firstJournal });
    await expect(worker.pull(secondJournal)).resolves.toMatchObject({ status: "absent" });
    await expect(worker.execute({ kind: "property.set", operationId: "00000000-0000-4000-8000-000000000827", entity: firstJournal, property: rating, values: [{ type: "text", value: "five" }] })).rejects.toThrow("PROPERTY_VALUE_TYPE_MISMATCH");
    await expect(worker.execute({ kind: "property.set", operationId: "00000000-0000-4000-8000-000000000828", entity: firstJournal, property: rating, values: [{ type: "number", value: 4 }, { type: "number", value: 5 }] })).rejects.toThrow("PROPERTY_CARDINALITY_VIOLATION");
  } finally { await worker.close(); }
});

it("serializes concurrent journal requests around the durable date identity", async () => {
  const worker = createPropertyTaskJournalWorker(":memory:");
  const first = "00000000-0000-4000-8000-000000000831";
  const second = "00000000-0000-4000-8000-000000000832";
  try {
    const results = await Promise.all([
      worker.execute({ kind: "journal.get", operationId: "00000000-0000-4000-8000-000000000833", journal: first, date: "2026-09-18", display: "18 Sep" }),
      worker.execute({ kind: "journal.get", operationId: "00000000-0000-4000-8000-000000000834", journal: second, date: "2026-09-18", display: "18 September" })
    ]);
    expect(results.map(result => "journal" in result ? result.journal : undefined)).toEqual([first, first]);
    expect(await worker.pull(second)).toMatchObject({ status: "absent" });
  } finally { await worker.close(); }
});

it("orders inherited effective properties by property name, not storage UUID", async () => {
  const worker = createPropertyTaskJournalWorker(":memory:");
  const node = "00000000-0000-4000-8000-000000000841";
  const personClass = "00000000-0000-4000-8000-000000000842";
  const zebra = "00000000-0000-4000-8000-000000000843";
  const alpha = "00000000-0000-4000-8000-000000000849";
  try {
    await worker.execute({ kind: "journal.get", operationId: "00000000-0000-4000-8000-000000000844", journal: node, date: "2026-09-19", display: "19 Sep" });
    await worker.execute({ kind: "property.define", operationId: "00000000-0000-4000-8000-000000000845", uuid: zebra, name: "zebra", type: "text", cardinality: "one" });
    await worker.execute({ kind: "property.define", operationId: "00000000-0000-4000-8000-000000000846", uuid: alpha, name: "alpha", type: "text", cardinality: "one" });
    await worker.execute({ kind: "class.define", operationId: "00000000-0000-4000-8000-000000000847", uuid: personClass, name: "Person", properties: [zebra, alpha] });
    await worker.execute({ kind: "class.assign", operationId: "00000000-0000-4000-8000-000000000848", entity: node, class: personClass });
    expect(await worker.effectiveProperties(node)).toEqual([alpha, zebra]);
  } finally { await worker.close(); }
});

it("cycles durable task state and preserves task date semantics in one operation", async () => {
  const worker = createPropertyTaskJournalWorker(":memory:");
  const task = "00000000-0000-4000-8000-000000000851";
  try {
    await worker.execute({ kind: "journal.get", operationId: "00000000-0000-4000-8000-000000000852", journal: task, date: "2026-09-20", display: "20 Sep" });
    await worker.execute({ kind: "task.set", operationId: "00000000-0000-4000-8000-000000000853", task, status: "Todo", priority: "A", scheduled: "2026-09-20", deadline: "2026-09-21" });
    const cycle = await worker.execute({ kind: "task.cycle", operationId: "00000000-0000-4000-8000-000000000854", task, statuses: ["Todo", "Doing", "Done"] });
    expect(cycle.datoms).toHaveLength(2);
    await expect(worker.pull(task)).resolves.toMatchObject({ status: "found", entity: { attributes: { ":task/status": ["Doing"], ":task/priority": ["A"], ":task/scheduled": ["2026-09-20"], ":task/deadline": ["2026-09-21"] } } });
  } finally { await worker.close(); }
});
