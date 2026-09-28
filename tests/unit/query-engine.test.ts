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
    await expect(engine.datalog('[:find ?b :in $ ?page :where [?b :block/page ?page]]', "Architecture")).resolves.toEqual([["a"]]);
  });
  it("pulls requested attributes and rejects result-limit overflow", async () => {
    const engine = createQueryEngine({ facts, limits: { maxResults: 1, maxIntermediateRows: 10, timeoutMs: 100 } });
    await expect(engine.pull("a", [":task/status", ":block/page"])).resolves.toEqual({ ":block/page": ["Architecture"], ":task/status": ["TODO"] });
    await expect(engine.simple("(task TODO DOING)")).rejects.toThrow("QUERY_LIMIT");
  });
  it("supports bounded logical or and not clauses", async () => {
    const engine = createQueryEngine({ facts });
    await expect(engine.datalog(JSON.stringify({ find: ["?b"], where: [["or", ["?b", ":task/status", "TODO"], ["?b", ":task/status", "DOING"]]] }))).resolves.toEqual([["a"], ["b"]]);
    await expect(engine.datalog(JSON.stringify({ find: ["?b"], where: [["?b", ":task/status", "TODO"], ["not", ["?b", ":block/page", "Archive"]]] }))).resolves.toEqual([["a"]]);
    await expect(engine.datalog(JSON.stringify({ find: ["?b"], where: [["and", ["?b", ":task/status", "TODO"], ["?b", ":block/page", "Architecture"]]] }))).resolves.toEqual([["a"]]);
  });
  it("evaluates joins, predicates, aggregates, rules and pull deterministically", async () => {
    const engine = createQueryEngine({ facts });
    await expect(engine.datalog(JSON.stringify({ find: ["?b"], where: [["or-join", ["?b"], ["?b", ":task/status", "TODO"], ["?b", ":task/status", "DOING"]], ["not-join", ["?b"], ["?b", ":block/page", "Archive"]]] }))).resolves.toEqual([["a"], ["b"]]);
    await expect(engine.datalog(JSON.stringify({ find: ["?b"], where: [["?b", ":task/status", "TODO"], ["pred", "includes?", "?b", "a"]] }))).resolves.toEqual([["a"]]);
    await expect(engine.datalog(JSON.stringify({ find: [["count-distinct", "?b"]], where: [["?b", ":task/status", "TODO"]] }))).resolves.toEqual([[1]]);
    await expect(engine.datalog(JSON.stringify({ find: [["pull", "?b", ":task/status", ":block/page"]], where: [["rule", "active"]], rules: { active: [["?b", ":task/status", "TODO"]] } }))).resolves.toEqual([[{ ":block/page": ["Architecture"], ":task/status": ["TODO"] }]]);
    await expect(engine.datalog('[:find (pull ?b [:task/status :block/page]) :where [?b :task/status "TODO"]]')).resolves.toEqual([[{ ":block/page": ["Architecture"], ":task/status": ["TODO"] }]]);
    await expect(engine.datalog('[:find (count-distinct ?b) :where [?b :task/status ?status] [(= ?status "TODO")]]')).resolves.toEqual([[1]]);
  });
});
