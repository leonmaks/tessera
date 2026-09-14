import assert from "node:assert/strict";
import { Given, Then, When } from "@cucumber/cucumber";
import { createImportExport } from "../../../packages/import-export/src/index.js";
interface World { document?: ReturnType<ReturnType<typeof createImportExport>["importMarkdown"]>; markdown?: string; }
Given("a graph block {string} contains a reference to page {string}", function (this: World, _block: string, page: string) { this.document = createImportExport().importMarkdown(`- [[${page}]]`); });
When("the graph is exported to Logseq-compatible Markdown", function (this: World) { this.markdown = createImportExport().exportMarkdown(this.document!); });
When("the Markdown is imported into a new graph", function (this: World) { this.document = createImportExport().importMarkdown(this.markdown!); });
Then("the normalized graph still contains the same semantic reference", function (this: World) { assert.equal(this.document!.blocks[0]!.inline.some(node => node.kind === "page-ref" && node.title === "Architecture"), true); });
