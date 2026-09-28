import { describe, expect, it, vi } from "vitest";
import { PluginCommandCollisionError, createPluginHost, type PluginCapabilityGateway, type PluginGraphChangeEvent } from "../../packages/plugin-host/src/index.js";

const event: PluginGraphChangeEvent = Object.freeze({
  blocks: Object.freeze([{ uuid: "00000000-0000-4000-8000-000000001001", title: "changed" }]),
  txData: Object.freeze([{ entity: "00000000-0000-4000-8000-000000001001", attribute: "block/title", value: "changed", added: true }]),
  txMeta: Object.freeze({ operationId: "00000000-0000-4000-8000-000000001002", revision: 7 })
});

function gateway() {
  const listeners = new Set<(change: PluginGraphChangeEvent) => void | Promise<void>>();
  const q = vi.fn(async (query: string) => ({ query }));
  const customQuery = vi.fn(async (query: string) => ({ query }));
  const datascriptQuery = vi.fn(async (query: string, ...inputs: readonly unknown[]) => ({ query, inputs }));
  const updateBlock = vi.fn(async (uuid: string, content: string) => ({ uuid, content }));
  const capabilities: PluginCapabilityGateway = {
    q: <T>(query: string) => q(query) as Promise<T>,
    customQuery: <T>(query: string) => customQuery(query) as Promise<T>,
    datascriptQuery: <T>(query: string, ...inputs: readonly unknown[]) => datascriptQuery(query, ...inputs) as Promise<T>,
    getCurrentBlock: vi.fn(async () => null),
    getBlock: vi.fn(async uuid => ({ uuid })),
    insertBlock: vi.fn(async (target, content, options) => ({ target, content, options })),
    updateBlock,
    removeBlock: vi.fn(async () => undefined),
    moveBlock: vi.fn(async () => undefined),
    subscribeChanges(listener) { listeners.add(listener); return () => listeners.delete(listener); },
  };
  return {
    capabilities,
    datascriptQuery,
    updateBlock,
    async emit(change: PluginGraphChangeEvent) { await Promise.all([...listeners].map(listener => listener(change))); }
  };
}

describe("plugin capability facade", () => {
  it("exposes queries and semantic editor calls only through the injected gateway", async () => {
    const capabilities = gateway();
    const facade = createPluginHost({ capabilities: capabilities.capabilities }).facade;

    await expect(facade.DB.datascriptQuery("[:find ?e]", "input")).resolves.toEqual({ query: "[:find ?e]", inputs: ["input"] });
    await expect(facade.Editor.updateBlock("00000000-0000-4000-8000-000000001001", "next")).resolves.toEqual({ uuid: "00000000-0000-4000-8000-000000001001", content: "next" });
    expect(capabilities.datascriptQuery).toHaveBeenCalledWith("[:find ?e]", "input");
    expect(capabilities.updateBlock).toHaveBeenCalledWith("00000000-0000-4000-8000-000000001001", "next");
    expect(facade).not.toHaveProperty("graphDb");
    expect(facade.DB).not.toHaveProperty("transact");
  });

  it("keeps the original command when a duplicate identifier is rejected", async () => {
    const facade = createPluginHost({ capabilities: gateway().capabilities }).facade;
    const action = vi.fn(async (value: unknown) => `first:${String(value)}`);
    facade.Commands.register("example/run", { placement: "palette", label: "Run" }, action);

    expect(() => facade.Commands.register("example/run", { placement: "palette", label: "Replace" }, vi.fn())).toThrow(PluginCommandCollisionError);
    await expect(facade.Commands.execute("example/run", "value")).resolves.toBe("first:value");
    expect(action).toHaveBeenCalledWith("value");
  });

  it("isolates a failed post-commit plugin handler while notifying later handlers", async () => {
    const capabilities = gateway();
    const errors = vi.fn();
    const facade = createPluginHost({ capabilities: capabilities.capabilities, onListenerError: errors }).facade;
    const later = vi.fn();
    facade.DB.onChanged(() => { throw new Error("plugin failure"); });
    facade.DB.onChanged(later);

    await expect(capabilities.emit(event)).resolves.toBeUndefined();
    expect(later).toHaveBeenCalledWith(event);
    expect(errors).toHaveBeenCalledWith(expect.objectContaining({ event, error: expect.any(Error) }));
  });
});
