import { expect,it,vi } from "vitest";import {createRemoteApi}from "../../packages/remote-api/src/index.js";it("fails closed before semantic dispatch",async()=>{const dispatch=vi.fn();const api=createRemoteApi(dispatch,8);await expect(api.invoke({operation:"raw.datom",payload:{},scopes:["graph:write"]})).rejects.toThrow();await expect(api.invoke({operation:"block.update",payload:{x:"long"},scopes:["graph:write"]})).rejects.toThrow();await expect(api.invoke({operation:"block.update",payload:{},scopes:[]})).rejects.toThrow();expect(dispatch).not.toHaveBeenCalled();});it("delegates Phase 04 operations only by semantic name",async()=>{const dispatch=vi.fn(async()=>"ok");const api=createRemoteApi(dispatch);await expect(api.invoke({operation:"task.complete",payload:{task:"id"},scopes:["graph:write"]})).resolves.toBe("ok");await expect(api.invoke({operation:"task.cycle",payload:{task:"id"},scopes:["graph:write"]})).resolves.toBe("ok");expect(dispatch).toHaveBeenLastCalledWith("task.cycle",{task:"id"});});

it("validates and delegates read-scoped queries by worker query name", async () => {
  const dispatch = vi.fn(async () => [["result"]]);
  const api = createRemoteApi(dispatch);
  const payload = { name: "query.datalog" as const, input: { query: "{}", inputs: [] } };

  await expect(api.invoke({ operation: "query", payload, scopes: ["graph:read"] })).resolves.toEqual([["result"]]);
  expect(dispatch).toHaveBeenCalledWith("query.datalog", payload.input);
  await expect(api.invoke({ operation: "query", payload: { name: "raw.javascript", input: {} }, scopes: ["graph:read"] })).rejects.toThrow();
  await expect(api.invoke({ operation: "query", payload, scopes: ["graph:write"] })).rejects.toThrow("FORBIDDEN");
});
