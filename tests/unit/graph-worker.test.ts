import { describe, expect, it, vi } from "vitest";
import { createAuthoritativeQueryService, createGraphWorker, createWorkerQueryCapabilities } from "../../packages/graph-worker/src/index.js";

const entity = "00000000-0000-4000-8000-000000000501";

describe("authoritative graph worker queries", () => {
  it("validates query envelopes and evaluates fresh authoritative scans", async () => {
    const scan = vi.fn(async () => [{ uuid: entity as never, attributes: { ":task/status": ["TODO"], ":block/page": ["Architecture"] } }]);
    const queries = createAuthoritativeQueryService({ scan });

    await expect(queries.query("query.datalog", { query: JSON.stringify({ find: ["?b"], where: [["?b", ":task/status", "TODO"]] }), inputs: [] })).resolves.toEqual([[entity]]);
    await expect(queries.query("query.pull", { entity, attributes: [":task/status"] })).resolves.toEqual({ ":task/status": ["TODO"] });
    await expect(queries.query("query.datalog", { query: "", inputs: [] })).rejects.toThrow();
    await expect(queries.query("raw.javascript", {})).rejects.toThrow("UNKNOWN_QUERY");
    expect(scan).toHaveBeenCalledTimes(4);
  });

  it("routes plugin query capabilities through the worker query port", async () => {
    const query = vi.fn(async (_name: string, input: unknown) => input);
    const worker = createGraphWorker({ execute: vi.fn(), query });
    const capabilities = createWorkerQueryCapabilities(worker);

    await expect(capabilities.datascriptQuery("query", "input")).resolves.toEqual({ query: "query", inputs: ["input"] });
    expect(query).toHaveBeenCalledWith("query.datalog", { query: "query", inputs: ["input"] });
  });
});
