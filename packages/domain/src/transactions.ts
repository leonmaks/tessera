import type { OperationId, UUID } from "./types.js";

export type GraphValue = string | number | boolean | { readonly type: "timestamp"; readonly value: number } | { readonly type: "entity"; readonly uuid: UUID };
export type TransactionSource = "editor" | "plugin" | "sync" | "cli" | "import" | "system";
export type TransactionAssertion =
  | { readonly kind: "entity.create"; readonly uuid?: UUID }
  | { readonly kind: "fact.set"; readonly entity: UUID; readonly attribute: string; readonly value: GraphValue }
  | { readonly kind: "fact.retract"; readonly entity: UUID; readonly attribute: string; readonly value: GraphValue };

export interface TransactionInput {
  readonly operationId: OperationId;
  readonly source: TransactionSource;
  readonly assertions: readonly TransactionAssertion[];
  readonly metadata?: Readonly<Record<string, unknown>>;
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const sources = new Set<TransactionSource>(["editor", "plugin", "sync", "cli", "import", "system"]);

export function asUUID(value: unknown, label = "UUID"): UUID {
  if (typeof value !== "string" || !uuidPattern.test(value)) throw new Error(`${label} must be a UUID`);
  return value as UUID;
}

export function parseGraphValue(value: unknown): GraphValue {
  if (typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("Graph number values must be finite");
    return value;
  }
  if (isRecord(value) && value.type === "timestamp" && typeof value.value === "number" && Number.isFinite(value.value) && Object.keys(value).length === 2) return { type: "timestamp", value: value.value };
  if (isRecord(value) && value.type === "entity" && Object.keys(value).length === 2) return { type: "entity", uuid: asUUID(value.uuid, "Entity reference") };
  throw new Error("Unsupported graph value");
}

export function parseTransactionInput(input: unknown): TransactionInput {
  if (!isRecord(input)) throw new Error("Transaction input must be an object");
  const operationId = asUUID(input.operationId, "operationId") as OperationId;
  if (typeof input.source !== "string" || !sources.has(input.source as TransactionSource)) throw new Error("Invalid transaction source");
  if (!Array.isArray(input.assertions)) throw new Error("Transaction assertions must be an array");
  const assertions = input.assertions.map(parseAssertion);
  const metadata = input.metadata === undefined ? undefined : parseMetadata(input.metadata);
  return metadata === undefined ? { operationId, source: input.source as TransactionSource, assertions } : { operationId, source: input.source as TransactionSource, assertions, metadata };
}

export function stableTransactionFingerprint(input: unknown): string { return stableJson(parseTransactionInput(input)); }
export function stableJson(value: unknown): string {
  if (value === null || typeof value === "string" || typeof value === "boolean") return JSON.stringify(value);
  if (typeof value === "number") { if (!Number.isFinite(value)) throw new Error("Non-finite value cannot be canonicalized"); return JSON.stringify(value); }
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (isRecord(value)) return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`;
  throw new Error("Unsupported canonical value");
}

function parseAssertion(value: unknown): TransactionAssertion {
  if (!isRecord(value) || typeof value.kind !== "string") throw new Error("Invalid transaction assertion");
  if (value.kind === "entity.create") return value.uuid === undefined ? { kind: "entity.create" } : { kind: "entity.create", uuid: asUUID(value.uuid) };
  if ((value.kind === "fact.set" || value.kind === "fact.retract") && typeof value.attribute === "string" && value.attribute.length > 0 && !/\s/.test(value.attribute)) return { kind: value.kind, entity: asUUID(value.entity, "Entity"), attribute: value.attribute, value: parseGraphValue(value.value) };
  throw new Error("Invalid transaction assertion");
}
function parseMetadata(value: unknown): Readonly<Record<string, unknown>> { if (!isRecord(value) || !isJson(value)) throw new Error("Transaction metadata must be a JSON object"); return value; }
function isRecord(value: unknown): value is Record<string, unknown> { return value !== null && typeof value === "object" && !Array.isArray(value); }
function isJson(value: unknown): boolean { if (value === null || typeof value === "string" || typeof value === "boolean") return true; if (typeof value === "number") return Number.isFinite(value); if (Array.isArray(value)) return value.every(isJson); return isRecord(value) && Object.values(value).every(isJson); }
