import assert from "node:assert/strict"; import { Given, Then, When } from "@cucumber/cucumber"; import { createSearchIndex } from "../../../packages/search/src/index.js";
interface World { index?: ReturnType<typeof createSearchIndex>; result?: readonly string[]; }
Given("searchable blocks {string} and {string} contain {string}", function (this: World, a: string, b: string, text: string) { this.index = createSearchIndex(); this.index.upsert({ uuid: a, text }); this.index.upsert({ uuid: b, text }); });
When("I keyword search {string}", function (this: World, term: string) { this.result = this.index!.search(term).map(value => value.uuid); });
Then("search results are {string}", function (this: World, values: string) { assert.deepEqual(this.result, values.split(",")); });
