import { describe, expect, it } from "vitest";
import { createPropertyService } from "../../packages/properties/src/index.js";

const ids = ["00000000-0000-4000-8000-000000000401", "00000000-0000-4000-8000-000000000402", "00000000-0000-4000-8000-000000000403"];
describe("typed properties and class DAG", () => {
  it("validates type/cardinality and resolves inherited definitions", async () => {
    let index = 0; const service = createPropertyService({ uuid: { next: () => ids[index++]! } });
    const birthday = await service.create({ name: "birthday", type: "date", cardinality: "one" });
    const rating = await service.create({ name: "rating", type: "number", cardinality: "one" });
    await service.defineClass("Person", [birthday.uuid]); await service.defineClass("Employee"); await service.extendClass("Employee", "Person"); await service.assignClass("alice", "Employee");
    await expect(service.set("alice", rating.uuid, { type: "text", value: "high" })).rejects.toMatchObject({ code: "INVALID_PROPERTY_VALUE" });
    await service.set("alice", rating.uuid, { type: "number", value: 5 });
    expect(await service.values("alice", rating.uuid)).toEqual([{ type: "number", value: 5 }]);
    expect((await service.effectiveDefinitions("alice")).map(definition => definition.name)).toEqual(["birthday"]);
  });
  it("rejects inheritance cycles without changing the class graph", async () => { const service = createPropertyService({ uuid: { next: () => ids[0]! } }); await service.defineClass("A"); await service.defineClass("B"); await service.extendClass("A", "B"); await expect(service.extendClass("B", "A")).rejects.toThrow("cycle"); expect(await service.parentsOf("B")).toEqual([]); });
});
