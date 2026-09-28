import assert from "node:assert/strict";
import { Given, Then, When } from "@cucumber/cucumber";
import { createQueryEngine } from "../../../packages/query-engine/src/index.js";
interface World { engine?: ReturnType<typeof createQueryEngine>; result?: unknown; error?: unknown; }
Given("tasks exist in statuses {string}, {string} and {string}", function (this: World, first: string, second: string, third: string) { this.engine = createQueryEngine({ facts: [{ entity: first, attribute: ":task/status", value: first }, { entity: second, attribute: ":task/status", value: second }, { entity: third, attribute: ":task/status", value: third }] }); });
Given("query page {string} contains block {string}", function (this: World, page: string, block: string) { this.engine = createQueryEngine({ facts: [{ entity: block, attribute: ":block/page", value: page.toLowerCase() }] }); });
When("I execute simple query {string}", async function (this: World, query: string) { this.result = await this.engine!.simple(query); });
Then("normalized results contain only the {string} and {string} tasks", function (this: World, first: string, second: string) { assert.deepEqual(this.result, [first, second].sort()); });
When("I execute the page-block Datalog query with input {string}", async function (this: World, input: string) { this.result = await this.engine!.datalog(JSON.stringify({ find: ["?b"], where: [["?b", ":block/page", "$0"]] }), input); });
Then("normalized results contain block {string}", function (this: World, block: string) { assert.deepEqual(this.result, [[block]]); });
Given("query facts for active tasks and archived blocks", function (this: World) {
  this.engine = createQueryEngine({ facts: [
    { entity: "A", attribute: ":task/status", value: "TODO" },
    { entity: "A", attribute: ":block/page", value: "Architecture" },
    { entity: "B", attribute: ":task/status", value: "DOING" },
    { entity: "C", attribute: ":task/status", value: "TODO" },
    { entity: "C", attribute: ":block/page", value: "Archive" }
  ] });
});
When("I execute a query using and, or-join and not-join", async function (this: World) {
  this.result = await this.engine!.datalog(JSON.stringify({
    find: ["?b"],
    where: [
      ["or-join", ["?b"], ["and", ["?b", ":task/status", "TODO"]], ["?b", ":task/status", "DOING"]],
      ["not-join", ["?b"], ["?b", ":block/page", "Archive"]]
    ]
  }));
});
Then("normalized query rows are {string} and {string}", function (this: World, first: string, second: string) { assert.deepEqual(this.result, [[first], [second]]); });
When("I execute a rule query with a predicate, aggregate and pull", async function (this: World) {
  const ruleQuery = JSON.stringify({ find: [["pull", "?b", ":task/status", ":block/page"]], where: [["rule", "todo"], ["pred", "=", "?b", "A"]], rules: { todo: [["?b", ":task/status", "TODO"]] } });
  const aggregateQuery = JSON.stringify({ find: [["count-distinct", "?b"]], where: [["rule", "todo"]], rules: { todo: [["?b", ":task/status", "TODO"]] } });
  this.result = { pull: await this.engine!.datalog(ruleQuery), aggregate: await this.engine!.datalog(aggregateQuery) };
});
Then("the advanced query result is normalized", function (this: World) {
  assert.deepEqual(this.result, { pull: [[{ ":block/page": ["Architecture"], ":task/status": ["TODO"] }]], aggregate: [[2]] });
});
Given("a query engine limited to one result", function (this: World) {
  this.engine = createQueryEngine({ facts: [{ entity: "A", attribute: ":task/status", value: "TODO" }, { entity: "B", attribute: ":task/status", value: "TODO" }], limits: { maxResults: 1 } });
});
When("I execute a query returning two rows", async function (this: World) {
  try { this.result = await this.engine!.datalog(JSON.stringify({ find: ["?b"], where: [["?b", ":task/status", "TODO"]] })); }
  catch (error) { this.error = error; }
});
Then("the query fails with a query limit error and no result", function (this: World) { assert.match(String(this.error), /QUERY_LIMIT/); assert.equal(this.result, undefined); });
