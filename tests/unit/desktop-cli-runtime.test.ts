import { describe, expect, it, vi } from "vitest";
import { createRuntimeRegistry } from "../../packages/desktop-cli-runtime/src/index.js";

describe("desktop CLI runtime", () => {
  it("reuses a healthy owner and replaces a stale one", async () => {
    const lock = new Map<string, string>(); const health = new Map<string, boolean>();
    const runtime = createRuntimeRegistry({ acquire: async (g, id) => { if (lock.has(g)) return false; lock.set(g, id); return true; }, release: async (g, id) => { if (lock.get(g) === id) lock.delete(g); }, healthy: async id => health.get(id) === true });
    const first = await runtime.start("g", "one"); health.set("one", true);
    expect((await runtime.start("g", "two")).owner).toBe("one"); health.set("one", false);
    expect((await runtime.start("g", "two")).owner).toBe("two"); expect(first.reused).toBe(false);
  });
  it("routes only semantic invokes and uses the backup capability", async () => {
    const invoke = vi.fn(async command => ({ command })); const backup = vi.fn(async () => "backup.db");
    const runtime = createRuntimeRegistry({ acquire: async () => true, release: async () => undefined, healthy: async () => false, invoke, backup });
    const daemon = await runtime.start("g", "one");
    await expect(daemon.invoke({ kind: "block.delete", uuid: "u" })).resolves.toEqual({ command: { kind: "block.delete", uuid: "u" } });
    await expect(daemon.invoke({ kind: "raw.datom" })).rejects.toThrow(); await expect(daemon.backup()).resolves.toBe("backup.db");
  });
});
