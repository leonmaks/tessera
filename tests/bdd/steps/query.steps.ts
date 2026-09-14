import assert from "node:assert/strict";
import { Given, Then, When } from "@cucumber/cucumber";
import { createQueryEngine } from "../../../packages/query-engine/src/index.js";
interface World { engine?: ReturnType<typeof createQueryEngine>; result?: unknown; }
Given("tasks exist in statuses {string}, {string} and {string}", function (this: World, first: string, second: string, third: string) { this.engine = createQueryEngine({ facts: [{ entity: first, attribute: ":task/status", value: first }, { entity: second, attribute: ":task/status", value: second }, { entity: third, attribute: ":task/status", value: third }] }); });
Given("query page {string} contains block {string}", function (this: World, page: string, block: string) { this.engine = createQueryEngine({ facts: [{ entity: block, attribute: ":block/page", value: page.toLowerCase() }] }); });
When("I execute simple query {string}", async function (this: World, query: string) { this.result = await this.engine!.simple(query); });
Then("normalized results contain only the {string} and {string} tasks", function (this: World, first: string, second: string) { assert.deepEqual(this.result, [first, second].sort()); });
When("I execute the page-block Datalog query with input {string}", async function (this: World, input: string) { this.result = await this.engine!.datalog(JSON.stringify({ find: ["?b"], where: [["?b", ":block/page", "$0"]] }), input); });
Then("normalized results contain block {string}", function (this: World, block: string) { assert.deepEqual(this.result, [[block]]); });
