import assert from "node:assert/strict";
import { Given, Then, When } from "@cucumber/cucumber";
import { createParser } from "../../../packages/parser/src/index.js";
import type { DocumentAst } from "../../../packages/parser/src/index.js";
import { createBacklinkIndex, extractReferences } from "../../../packages/references/src/index.js";

interface World { inline?: readonly unknown[]; document?: DocumentAst; sources?: { uuid: string; inline: readonly unknown[] }[]; output?: readonly string[]; }
const parser = createParser();
function parse(world: World, source: string) { const document = parser.parseMarkdown(source.startsWith("-") ? source : `- ${source}`); const value = document.blocks[0]!.inline; world.document = document; world.inline = value; return value; }
When("I parse Markdown {string}", function (this: World, source: string) { parse(this, source); });
When("I parse nested Markdown", function (this: World) { parse(this, "- A\n  - B"); });
Then("the parsed inline nodes include page reference {string}", function (this: World, title: string) { assert.ok((this.inline as readonly { kind: string; title?: string }[]).some(node => node.kind === "page-ref" && node.title === title)); });
Then("extracted page references are {string}", function (this: World, pages: string) { assert.deepEqual(extractReferences(this.inline as never).pages, pages ? pages.split(",") : []); });
Given("parsed source block {string} contains {string}", function (this: World, uuid: string, source: string) { (this.sources ??= []).push({ uuid, inline: parse(this, source) }); });
When("I project backlinks for page {string}", function (this: World, title: string) { this.output = createBacklinkIndex(this.sources as never).page(title); });
Then("backlink UUIDs are {string}", function (this: World, uuids: string) { assert.deepEqual(this.output, uuids ? uuids.split(",") : []); });
Then("the first parsed block has child {string}", function (this: World, content: string) { assert.equal(this.document?.blocks[0]?.children[0]?.raw, content); });
