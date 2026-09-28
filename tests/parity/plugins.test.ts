import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { createPluginHost, type PluginCapabilityGateway } from "../../packages/plugin-host/src/index.js";
import { runParity } from "../../packages/compatibility-oracle/src/index.js";
import type { CanonicalSnapshot, CompatibilityScenario, ParityProvider, ReferenceProvider } from "../../packages/compatibility-oracle/src/index.js";
import { baseline, sha } from "../support/harness.js";

const scenario = JSON.parse(readFileSync(new URL("../fixtures/parity/plugins/command-execution.scenario.json", import.meta.url), "utf8")) as CompatibilityScenario;
const snapshot: CanonicalSnapshot = { graphLabel: scenario.id, nodes: [{ uuid: "00000000-0000-4000-8000-000000001101", kind: "plugin-command", content: "example/run", tags: [], refs: [], properties: { args: ["payload"] } }] };

function capabilities(): PluginCapabilityGateway {
  return {
    q: async <T,>() => undefined as T, customQuery: async <T,>() => undefined as T, datascriptQuery: async <T,>() => undefined as T,
    getCurrentBlock: async () => null, getBlock: async () => null, insertBlock: async () => null,
    updateBlock: async () => undefined, removeBlock: async () => undefined, moveBlock: async () => undefined,
    subscribeChanges: () => () => undefined
  };
}

const candidate: ParityProvider = {
  name: "phase10-plugin-candidate",
  async execute(input) {
    const command = input.commands[0];
    if (command?.op !== "pluginCommand") throw new Error("Plugin fixture requires pluginCommand");
    let received: readonly unknown[] = [];
    const facade = createPluginHost({ capabilities: capabilities() }).facade;
    facade.Commands.register(command.id, { label: "Run", placement: "palette" }, (...args) => { received = args; });
    await facade.Commands.execute(command.id, ...command.args);
    return JSON.stringify(received) === JSON.stringify(command.args) ? snapshot : { ...snapshot, nodes: [] };
  }
};
const reference: ReferenceProvider = { name: "phase10-fixture-test-double", baselineCommit: sha, evidence: "test-double", async execute() { return snapshot; } };

it("keeps Phase 10 plugin command provenance explicit", async () => {
  await expect(runParity(baseline, scenario, candidate, reference)).resolves.toMatchObject({ equal: true, compatible: false });
});
