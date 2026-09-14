import { describe, expect, it } from "vitest";
import { createGraphDatabase } from "../../packages/graph-db/src/index.js";

const operation = "00000000-0000-4000-8000-000000000020";
const entity = "00000000-0000-4000-8000-000000000021";
const input = { operationId: operation, source: "editor" as const, assertions: [
  { kind: "entity.create" as const, uuid: entity },
  { kind: "fact.set" as const, entity, attribute: ":block/title", value: "First" }
] };

function graph() {
  return createGraphDatabase({ path: ":memory:", clock: { now: () => 10 }, uuid: { next: () => entity } });
}

describe("transaction engine", () => {
  it("commits complete canonical reports and advances one revision", async () => {
    const db = graph();
    const report = await db.transact(input);
    expect(report).toMatchObject({ operationId: operation, revision: 1, datoms: [{ entity, attribute: ":block/title", value: "First", added: true }] });
    expect(Object.isFrozen(report)).toBe(true);
    expect(db.revision).toBe(1);
    await db.close();
  });

  it("is atomic for invalid assertions", async () => {
    const db = graph();
    await expect(db.transact({ ...input, assertions: [...input.assertions, { kind: "fact.set", entity, attribute: ":block/count", value: Number.NaN }] })).rejects.toThrow();
    expect(db.revision).toBe(0);
    await expect(db.pull(["*"], entity)).resolves.toEqual({ status: "absent", uuid: entity });
    await db.close();
  });

  it("replays an exact operation once and rejects conflicting reuse", async () => {
    const db = graph();
    const first = await db.transact(input);
    await expect(db.transact(input)).resolves.toEqual(first);
    await expect(db.transact({ ...input, assertions: [...input.assertions, { kind: "fact.set", entity, attribute: ":block/title", value: "Second" }] })).rejects.toThrow("operationId");
    expect(db.revision).toBe(1);
    await db.close();
  });

  it("allocates an omitted entity UUID once and replays the original report", async () => {
    const allocated = "00000000-0000-4000-8000-000000000022";
    let generated = 0;
    const db = createGraphDatabase({ path: ":memory:", clock: { now: () => 10 }, uuid: { next: () => { generated++; return allocated; } } });
    const create = { operationId: "00000000-0000-4000-8000-000000000023", source: "editor", assertions: [{ kind: "entity.create" }] };
    const first = await db.transact(create);
    await expect(db.transact(create)).resolves.toEqual(first);
    expect(generated).toBe(1);
    await expect(db.pull(["*"], allocated)).resolves.toMatchObject({ status: "found" });
    await db.close();
  });
});
