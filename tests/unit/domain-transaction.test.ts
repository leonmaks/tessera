import { describe, expect, it } from "vitest";
import { parseTransactionInput, stableTransactionFingerprint } from "../../packages/domain/src/index.js";

const operationId = "00000000-0000-4000-8000-000000000010";
const entity = "00000000-0000-4000-8000-000000000011";

describe("domain transaction contract", () => {
  it("validates public UUIDs and typed fact values", () => {
    expect(parseTransactionInput({ operationId, source: "editor", assertions: [
      { kind: "entity.create", uuid: entity },
      { kind: "fact.set", entity, attribute: ":block/title", value: "A" },
      { kind: "fact.set", entity, attribute: ":block/done", value: false },
      { kind: "fact.set", entity, attribute: ":block/time", value: { type: "timestamp", value: 5 } }
    ] })).toMatchObject({ operationId, source: "editor" });
    expect(() => parseTransactionInput({ operationId: "bad", source: "editor", assertions: [] })).toThrow();
    expect(() => parseTransactionInput({ operationId, source: "editor", assertions: [{ kind: "fact.set", entity, attribute: ":x/y", value: Number.NaN }] })).toThrow();
  });

  it("fingerprints equivalent object key enumeration identically but preserves assertion order", () => {
    const first = { operationId, source: "editor", metadata: { b: 2, a: 1 }, assertions: [{ kind: "entity.create", uuid: entity }, { kind: "fact.set", entity, attribute: ":block/title", value: "A" }] };
    const reorderedKeys = { source: "editor", assertions: first.assertions, metadata: { a: 1, b: 2 }, operationId };
    expect(stableTransactionFingerprint(first)).toBe(stableTransactionFingerprint(reorderedKeys));
    expect(stableTransactionFingerprint({ ...first, assertions: [...first.assertions].reverse() })).not.toBe(stableTransactionFingerprint(first));
  });
});
