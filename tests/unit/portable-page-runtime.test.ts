import { expect, it } from "vitest";
import { executePageCreate } from "../../packages/graph-worker/src/portable-page-runtime.js";

it("creates once and resolves a case-insensitive existing page through a storage port", async () => {
  const pages: { uuid: string; content: string }[] = [];
  let next = 0;
  const port = { pages: async () => pages, createPage: async (content: string) => { const page = { uuid: `page-${++next}`, content }; pages.push(page); return page; } };
  await expect(executePageCreate("Notes", port)).resolves.toEqual({ focus: "page-1", created: true });
  await expect(executePageCreate("notes", port)).resolves.toEqual({ focus: "page-1", created: false });
  expect(pages).toEqual([{ uuid: "page-1", content: "Notes" }]);
});
