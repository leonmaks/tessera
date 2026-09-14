import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Given, Then, When } from "@cucumber/cucumber";
import { createGraphDatabase } from "../../../packages/graph-db/src/index.js";
import type { GraphDatabase, TxReport } from "../../../packages/graph-db/src/index.js";

const entity = "00000000-0000-4000-8000-000000000071";
const operation = "00000000-0000-4000-8000-000000000070";
interface TransactionWorld { db?: GraphDatabase; report?: TxReport; before?: number; error?: unknown; healthy?: boolean; path?: string; pull?: unknown; }
function open(path = ":memory:"): GraphDatabase { return createGraphDatabase({ path, clock: { now: () => 1 }, uuid: { next: () => entity } }); }
function validInput() { return { operationId: operation, source: "editor" as const, assertions: [{ kind: "entity.create" as const, uuid: entity }, { kind: "fact.set" as const, entity, attribute: ":block/title", value: "title" }] }; }

Given("a Phase 01 graph at revision 0", function (this: TransactionWorld) { this.db = open(); this.before = this.db.revision; });
Given("a Phase 01 graph with a committed operation", async function (this: TransactionWorld) { this.db = open(); this.report = await this.db.transact(validInput()); this.before = this.db.revision; });
Given("a Phase 01 graph with one failing and one healthy listener", function (this: TransactionWorld) { this.db = open(); this.db.subscribePostCommit(() => { throw new Error("fail"); }); this.db.subscribePostCommit(() => { this.healthy = true; }); });
Given("a Phase 01 graph transaction is interrupted before commit", async function (this: TransactionWorld) { this.path = join(mkdtempSync(join(tmpdir(), "tessera-bdd-")), "graph.sqlite"); this.db = open(this.path); await this.db.close(); });
When("I submit a graph transaction with a valid fact and an invalid value", async function (this: TransactionWorld) { try { await this.db!.transact({ ...validInput(), assertions: [...validInput().assertions, { kind: "fact.set", entity, attribute: ":block/count", value: Number.NaN }] }); } catch (error) { this.error = error; } });
When("I retry the identical Phase 01 operation", async function (this: TransactionWorld) { this.report = await this.db!.transact(validInput()); });
When("I reuse its Phase 01 operation id with changed assertions", async function (this: TransactionWorld) { try { await this.db!.transact({ ...validInput(), assertions: [{ kind: "entity.create", uuid: entity }, { kind: "fact.set", entity, attribute: ":block/title", value: "changed" }] }); } catch (error) { this.error = error; } });
When("I pull an absent Phase 01 UUID", async function (this: TransactionWorld) { delete this.report; this.pull = await this.db!.pull(["*"], "00000000-0000-4000-8000-000000000079"); });
When("I submit a valid Phase 01 transaction", async function (this: TransactionWorld) { this.report = await this.db!.transact(validInput()); });
When("the Phase 01 graph is reopened", async function (this: TransactionWorld) { await this.db!.close(); this.db = open(this.path); });
Then("the Phase 01 transaction is rejected without a revision change", function (this: TransactionWorld) { assert.ok(this.error); assert.equal(this.db!.revision, this.before); });
Then("I receive the original Phase 01 report without another revision", function (this: TransactionWorld) { assert.equal(this.report!.revision, this.before); assert.equal(this.db!.revision, this.before); });
Then("the Phase 01 pull reports absence", function (this: TransactionWorld) { assert.deepEqual(this.pull, { status: "absent", uuid: "00000000-0000-4000-8000-000000000079" }); });
Then("the healthy Phase 01 listener receives the committed report", function (this: TransactionWorld) { assert.equal(this.healthy, true); assert.equal(this.db!.revision, 1); });
Then("the interrupted Phase 01 facts are absent", async function (this: TransactionWorld) { assert.deepEqual(await this.db!.pull(["*"], entity), { status: "absent", uuid: entity }); await this.db!.close(); });
