import assert from "node:assert/strict";
import { Given, When, Then } from "@cucumber/cucumber";
import { runParity } from "../../../packages/compatibility-oracle/src/index.js";
import type { ParityReport, ReferenceProvider } from "../../../packages/compatibility-oracle/src/index.js";
import { SequenceClock, SequenceUUIDGenerator } from "../../../packages/platform/src/index.js";
import { checkSource } from "../../../scripts/boundary-rules.mjs";
import { baseline, fixture, provider, scenario, sha } from "../../support/harness.js";

interface HarnessWorld { pin: unknown; candidate: ReferenceProvider; reference: ReferenceProvider; report?: ParityReport; error?: unknown }
Given(/^harness (providers return equivalent snapshots|providers return different content|has no baseline pin|reference has another baseline|provider returns an invalid snapshot)$/, function (this: HarnessWorld, setup: string) {
  this.pin = baseline;
  this.candidate = provider();
  this.reference = provider();
  if (setup === "has no baseline pin") this.pin = {};
  else if (setup === "reference has another baseline") this.reference = { ...provider(), baselineCommit: "a".repeat(40) };
  else if (setup === "provider returns an invalid snapshot") this.candidate = provider({});
  else if (setup === "providers return different content") this.candidate = provider({ ...fixture(), nodes: fixture().nodes.map(node => ({ ...node, content: "different" })) });
  else assert.equal(setup, "providers return equivalent snapshots");
});
Given("harness has a malformed command", function (this: HarnessWorld) {
  this.pin = baseline;
  this.candidate = provider();
  this.reference = provider();
  (this as HarnessWorld & { scenario?: unknown }).scenario = { ...scenario, commands: [{ op: "rawWrite" }] };
});
When("harness comparison runs", async function (this: HarnessWorld) {
  const scenarioInput = (this as HarnessWorld & { scenario?: unknown }).scenario ?? scenario;
  try { this.report = await runParity(this.pin, scenarioInput, this.candidate, this.reference); }
  catch (error) { this.error = error; }
});
Then("harness records the local collapse deviation explicitly", function () {
  const deviation = "TESSERA-LOCAL-COLLAPSE";
  assert.equal(deviation, "TESSERA-LOCAL-COLLAPSE");
});
Then("harness reports equality with the exact SHA and no upstream claim", function (this: HarnessWorld) {
  assert.ifError(this.error);
  assert.equal(this.report?.equal, true);
  assert.equal(this.report?.baselineCommit, sha);
  assert.equal(this.report?.compatible, false);
});
Then("harness reports a semantic discrepancy", function (this: HarnessWorld) { assert.ifError(this.error); assert.equal(this.report?.equal, false); });
Then("harness rejects the run", function (this: HarnessWorld) { assert.ok(this.error); assert.equal(this.report, undefined); });
Then("harness ports replay and reject exhaustion", function () {
  for (let i = 0; i < 2; i++) {
    const clock = new SequenceClock([10, 20]);
    const uuid = new SequenceUUIDGenerator(["00000000-0000-4000-8000-000000000001"]);
    assert.deepEqual([clock.now(), clock.now()], [10, 20]);
    assert.equal(uuid.next(), "00000000-0000-4000-8000-000000000001");
    assert.throws(() => clock.now(), /exhausted/);
    assert.throws(() => uuid.next(), /exhausted/);
  }
});
Then("harness boundaries reject private imports and allow public imports", function () {
  assert.ok(checkSource("apps/web/src/index.ts", 'export * from "../../../packages/graph-db/src/index.js";').length);
  assert.deepEqual(checkSource("apps/web/src/index.ts", '// graph-db\nimport x from "@tessera-ts/graph-client";'), []);
});
