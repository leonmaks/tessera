import type { CommandEnvelope, Revision } from "@tessera-ts/domain";
import type { CommandResult, GraphWorker, RenderDelta } from "./contracts.js";

export interface CommandExecution<T> {
  readonly operationId: CommandResult<T>["operationId"];
  readonly transactionId: number;
  readonly revision: Revision;
  readonly result: T;
  readonly delta: RenderDelta;
}

export interface GraphWorkerOptions {
  execute(command: CommandEnvelope): Promise<CommandExecution<unknown>>;
  query(name: string, input: unknown): Promise<unknown>;
}

/** The sole publisher of committed graph effects to renderer observers. */
export function createGraphWorker(options: GraphWorkerOptions): GraphWorker {
  const listeners = new Set<(delta: RenderDelta) => void>();
  return {
    async execute<T>(command: CommandEnvelope): Promise<CommandResult<T>> {
      const committed = await options.execute(command);
      assertCommitted(command, committed);
      const delta = freeze(committed.delta);
      for (const listener of listeners) try { listener(delta); } catch { /* observers cannot undo a commit */ }
      return freeze({ operationId: committed.operationId, transactionId: committed.transactionId, revision: committed.revision, result: committed.result as T });
    },
    async query<T>(name: string, input: unknown): Promise<T> { return options.query(name, input) as Promise<T>; },
    subscribe(listener: (delta: RenderDelta) => void): () => void { listeners.add(listener); return () => listeners.delete(listener); }
  };
}

export interface BrowserPort { postMessage(message: unknown): void; addEventListener(type: "message", listener: (event: { readonly data: unknown }) => void): void; start?(): void; }
export interface NodePort { postMessage(message: unknown): void; on(type: "message", listener: (message: unknown) => void): unknown; }
interface Request { readonly id: string; readonly kind: "command" | "query"; readonly payload: unknown; }

/** Adapts a browser Worker/MessagePort without exposing graph storage to that port. */
export function attachBrowserWorkerPort(worker: GraphWorker, port: BrowserPort): () => void {
  const unsubscribe = worker.subscribe(delta => port.postMessage(freeze({ kind: "event", event: "render-delta", payload: delta })));
  port.addEventListener("message", event => { void dispatch(worker, event.data, message => port.postMessage(message)); });
  port.start?.();
  return unsubscribe;
}

/** Adapts Node worker_threads-style ports with the same typed local protocol. */
export function attachNodeWorkerPort(worker: GraphWorker, port: NodePort): () => void {
  const unsubscribe = worker.subscribe(delta => port.postMessage(freeze({ kind: "event", event: "render-delta", payload: delta })));
  port.on("message", message => { void dispatch(worker, message, response => port.postMessage(response)); });
  return unsubscribe;
}

async function dispatch(worker: GraphWorker, raw: unknown, respond: (message: unknown) => void): Promise<void> {
  const request = parseRequest(raw);
  try {
    const value = request.kind === "command"
      ? await worker.execute(request.payload as CommandEnvelope)
      : await worker.query(queryName(request.payload), queryInput(request.payload));
    respond(freeze({ id: request.id, kind: "response", ok: true, value }));
  } catch (error) { respond(freeze({ id: request.id, kind: "response", ok: false, error: error instanceof Error ? error.message : "Unknown worker error" })); }
}

function parseRequest(raw: unknown): Request {
  if (!raw || typeof raw !== "object") throw new Error("Invalid worker request");
  const request = raw as Record<string, unknown>;
  if (typeof request.id !== "string" || (request.kind !== "command" && request.kind !== "query")) throw new Error("Invalid worker request");
  return { id: request.id, kind: request.kind, payload: request.payload };
}
function queryName(payload: unknown): string { if (!payload || typeof payload !== "object" || typeof (payload as Record<string, unknown>).name !== "string") throw new Error("Invalid query request"); return (payload as Record<string, unknown>).name as string; }
function queryInput(payload: unknown): unknown { return payload && typeof payload === "object" ? (payload as Record<string, unknown>).input : undefined; }
function assertCommitted(command: CommandEnvelope, result: CommandExecution<unknown>): void {
  if (result.operationId !== command.commandId || result.delta.operationId !== undefined && result.delta.operationId !== result.operationId) throw new Error("Invalid committed operation metadata");
  if (result.revision !== result.delta.rev || result.delta.graphId !== command.graphId) throw new Error("Invalid committed render delta");
}
function freeze<T>(value: T): T { if (value && typeof value === "object" && !Object.isFrozen(value)) { for (const child of Object.values(value as Record<string, unknown>)) freeze(child); Object.freeze(value); } return value; }
