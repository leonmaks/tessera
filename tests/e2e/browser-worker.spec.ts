import { expect, test } from "@playwright/test";

test("@phase-06 browser worker owns SQLite OPFS authority", async ({ page }) => {
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const worker = new Worker("/src/browser-sqlite.worker.ts", { type: "module" });
    try {
      return await new Promise<unknown>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("browser worker timeout")), 15_000);
        worker.addEventListener("message", event => { clearTimeout(timeout); resolve(event.data); }, { once: true });
        worker.addEventListener("error", event => { clearTimeout(timeout); reject(new Error(event.message)); }, { once: true });
        worker.postMessage({ id: "health", graphName: `e2e-${crypto.randomUUID()}` });
      });
    } finally { worker.terminate(); }
  });
  expect(result).toMatchObject({ id: "health", ok: true, backend: "sqlite-wasm-opfs-sahpool", rawHandleExposed: false });
});

test("@phase-06 browser worker applies the shared page-create semantic command once", async ({ page }) => {
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const worker = new Worker("/src/browser-sqlite.worker.ts", { type: "module" });
    const request = (id: string, graphName: string, command: unknown) => new Promise<unknown>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("browser worker timeout")), 15_000);
      const listener = (event: MessageEvent) => { if (event.data?.id !== id) return; clearTimeout(timeout); worker.removeEventListener("message", listener); resolve(event.data); };
      worker.addEventListener("message", listener);
      worker.postMessage({ id, graphName, command });
    });
    const graphName = `semantic-${crypto.randomUUID()}`;
    try { return [await request("one", graphName, { kind: "page.create", title: "Notes" }), await request("two", graphName, { kind: "page.create", title: "notes" })]; }
    finally { worker.terminate(); }
  });
  expect(result).toEqual([expect.objectContaining({ id: "one", ok: true, created: true, revision: 1, rawHandleExposed: false }), expect.objectContaining({ id: "two", ok: true, created: false, revision: 1, rawHandleExposed: false })]);
  const node = await page.evaluate(async () => {
    const invoke = async (payload: unknown) => {
      const response = await fetch("/local/editor", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      return response.json() as Promise<{ snapshot: { revision: number; pages: { uuid: string; content: string }[] }; focus?: string }>;
    };
    const before = await invoke(null);
    const first = await invoke({ operationId: crypto.randomUUID(), revision: before.snapshot.revision, command: { kind: "page.create", title: "Portable Notes" } });
    const second = await invoke({ operationId: crypto.randomUUID(), revision: first.snapshot.revision, command: { kind: "page.create", title: "portable notes" } });
    return {
      firstAdvancedRevision: first.snapshot.revision === before.snapshot.revision + 1,
      firstFocusedTitle: first.snapshot.pages.find(page => page.uuid === first.focus)?.content,
      duplicateKeptRevision: second.snapshot.revision === first.snapshot.revision,
      duplicatePageCount: second.snapshot.pages.filter(page => page.content.toLocaleLowerCase() === "portable notes").length,
    };
  });
  expect(node).toEqual({ firstAdvancedRevision: true, firstFocusedTitle: "Portable Notes", duplicateKeptRevision: true, duplicatePageCount: 1 });
});
