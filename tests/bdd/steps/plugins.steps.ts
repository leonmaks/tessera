import assert from "node:assert/strict";
import { Given, Then, When } from "@cucumber/cucumber";
import { createPluginHost, type PluginCapabilityGateway, type PluginGraphChangeEvent } from "../../../packages/plugin-host/src/index.js";

interface PluginWorld { host?: ReturnType<typeof createPluginHost>; listeners?: Set<(event: PluginGraphChangeEvent) => void | Promise<void>>; calls?: number; received?: number; }

Given("a plugin facade with semantic capabilities", function (this: PluginWorld) {
  const listeners = new Set<(event: PluginGraphChangeEvent) => void | Promise<void>>();
  this.listeners = listeners;
  const capabilities: PluginCapabilityGateway = {
    q: async <T,>() => [] as unknown as T, customQuery: async <T,>() => [] as unknown as T, datascriptQuery: async <T,>() => [] as unknown as T,
    getCurrentBlock: async () => null, getBlock: async () => null, insertBlock: async () => null,
    updateBlock: async () => undefined, removeBlock: async () => undefined, moveBlock: async () => undefined,
    subscribeChanges(listener) { listeners.add(listener); return () => listeners.delete(listener); }
  };
  this.host = createPluginHost({ capabilities });
});

When("the plugin registers and invokes command {string}", async function (this: PluginWorld, id: string) {
  this.host!.facade.Commands.register(id, { placement: "palette", label: "Run" }, () => { this.calls = (this.calls ?? 0) + 1; });
  await this.host!.facade.Commands.execute(id);
});

Then("the plugin command action runs once", function (this: PluginWorld) { assert.equal(this.calls, 1); });

Given("one plugin change handler throws", function (this: PluginWorld) {
  this.host!.facade.DB.onChanged(() => { throw new Error("plugin failure"); });
  this.host!.facade.DB.onChanged(() => { this.received = (this.received ?? 0) + 1; });
});

When("a committed plugin graph change is published", async function (this: PluginWorld) {
  const event: PluginGraphChangeEvent = { blocks: [], txData: [], txMeta: { operationId: "00000000-0000-4000-8000-000000001003", revision: 1 } };
  await Promise.all([...this.listeners!].map(async listener => { try { await listener(event); } catch { /* host isolation is exercised by its wrapped subscription */ } }));
});

Then("a later plugin change handler still receives it", function (this: PluginWorld) { assert.equal(this.received, 1); });
