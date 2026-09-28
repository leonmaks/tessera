import { spawnSync } from "node:child_process";
import { Then, When } from "@cucumber/cucumber";
import { expect } from "vitest";

interface PhaseGateWorld {
  output?: string;
  status?: number | null;
}

When(/^the phase (audit|PRE) gate runs$/, function (this: PhaseGateWorld, mode: string) {
  const argument = mode === "PRE" ? "--pre" : "--audit";
  const result = spawnSync(process.execPath, ["scripts/phase-quality-gate.mjs", argument], { encoding: "utf8" });
  this.status = result.status;
  this.output = `${result.stdout}\n${result.stderr}`;
});

Then("the phase gate passes", function (this: PhaseGateWorld) {
  expect(this.status).toBe(0);
  expect(this.output).toContain("GATE_STATUS: PASS");
});

Then("the phase gate fails", function (this: PhaseGateWorld) {
  expect(this.status).toBe(1);
  expect(this.output).toContain("GATE_STATUS: FAIL");
});

Then("implementation is reported as locked", function (this: PhaseGateWorld) {
  expect(this.output).toContain("IMPLEMENTATION_LOCKED: true");
});

Then("the phase gate explains that handoff approval is required", function (this: PhaseGateWorld) {
  expect(this.output).toContain("handoff is locked");
});
