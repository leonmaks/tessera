import { z } from "zod";

export interface ApiRequest { readonly operation: string; readonly payload: unknown; readonly scopes: readonly string[]; }

const queryPayload = z.strictObject({
  name: z.enum(["query.simple", "query.datalog", "query.custom", "query.pull"]),
  input: z.unknown()
});
const writeOperations = new Set(["block.update", "block.delete", "page.create", "property.define", "property.set", "class.define", "class.extend", "class.assign", "task.set", "task.cycle", "task.complete", "journal.get"]);

export function createRemoteApi(dispatch: (operation: string, payload: unknown) => Promise<unknown>, maxBytes = 65536) {
  return {
    async invoke(request: ApiRequest) {
      if (request.operation.startsWith("raw.")) throw new Error("RAW_MUTATION_FORBIDDEN");
      let encoded: Uint8Array;
      try { encoded = new TextEncoder().encode(JSON.stringify(request.payload)); }
      catch { throw new Error("INVALID_PAYLOAD"); }
      if (encoded.length > maxBytes) throw new Error("PAYLOAD_TOO_LARGE");
      if (request.operation === "query") {
        if (!request.scopes.includes("graph:read")) throw new Error("FORBIDDEN");
        const query = queryPayload.parse(request.payload);
        return dispatch(query.name, query.input);
      }
      if (!writeOperations.has(request.operation)) throw new Error("UNKNOWN_OPERATION");
      if (!request.scopes.includes("graph:write")) throw new Error("FORBIDDEN");
      return dispatch(request.operation, request.payload);
    }
  };
}
