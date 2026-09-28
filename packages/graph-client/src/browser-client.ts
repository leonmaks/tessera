import type { CommandEnvelope } from "@tessera-ts/domain";
import type { RendererStore, RenderDeltaInput } from "./index.js";

export interface BrowserWorkerPort { postMessage(message: unknown): void; addEventListener(type: "message", listener: (event: { readonly data: unknown }) => void): void; }

/** Renderer-side transport. It never receives or exposes the SQLite handle. */
export function createBrowserGraphClient(port: BrowserWorkerPort, store: RendererStore) {
  let nextId = 0;
  const pending = new Map<string, { resolve(value: unknown): void; reject(error: Error): void }>();
  port.addEventListener("message", event => {
    const message = event.data; if (!message || typeof message !== "object") return; const record = message as Record<string, unknown>;
    if (record.kind === "event" && record.event === "render-delta") { store.apply(record.payload as RenderDeltaInput); return; }
    if (record.kind !== "response" || typeof record.id !== "string") return;
    const request = pending.get(record.id); if (!request) return; pending.delete(record.id);
    if (record.ok === true) request.resolve(record.value); else request.reject(new Error(typeof record.error === "string" ? record.error : "Browser worker request failed"));
  });
  const request = <T>(kind: "command" | "query", payload: unknown): Promise<T> => new Promise((resolve, reject) => { const id = `browser-${++nextId}`; pending.set(id, { resolve: value => resolve(value as T), reject }); port.postMessage({ id, kind, payload }); });
  return Object.freeze({ snapshot: store.snapshot, subscribe: store.subscribe, execute: <T = unknown>(command: CommandEnvelope) => request<T>("command", command), query: <T = unknown>(name: string, input: unknown) => request<T>("query", { name, input }) });
}
