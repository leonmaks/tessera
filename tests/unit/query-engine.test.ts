import { describe, expect, it } from "vitest";
import { createQueryEngine } from "../../packages/query-engine/src/index.js";

const facts = [
  { entity: "a", attribute: ":task/status", value: "TODO" },
  { entity: "b", attribute: ":task/status", value: "DOING" },
  { entity: "c", attribute: ":task/status", value: "DONE" },
  { entity: "a", attribute: ":block/page", value: "Architecture" }
];
describe("bounded Datalog query engine", () => {
  it("executes simple task queries and deterministic Datalog bindings", async () => {
    const engine = createQueryEngine({ facts });
    await expect(engine.simple("(task TODO DOING)")).resolves.toEqual(["a", "b"]);
    await expect(engine.datalog(JSON.stringify({ find: ["?b"], where: [["?b", ":block/page", "$0"]] }), "Architecture")).resolves.toEqual([["a"]]);
  });
  it("pulls requested attributes and rejects result-limit overflow", async () => {
    const engine = createQueryEngine({ facts, limits: { maxResults: 1, maxIntermediateRows: 10, timeoutMs: 100 } });
    await expect(engine.pull("a", [":task/status", ":block/page"])).resolves.toEqual({ ":block/page": ["Architecture"], ":task/status": ["TODO"] });
    await expect(engine.simple("(task TODO DOING)")).rejects.toThrow("QUERY_LIMIT");
  });
});
