import { expect, it, vi } from "vitest";
import { createEditorController } from "../../packages/editor-ui/src/index.js";

it("normalizes Enter into one semantic split command", () => {
  const send = vi.fn();
  const editor = createEditorController({ send });
  editor.focus("B", 6);
  editor.key("Enter");
  expect(send).toHaveBeenCalledWith({ kind: "split", block: "B", offset: 6 });
});

it("keeps collapse state outside graph commands", () => {
  const send = vi.fn();
  const editor = createEditorController({ send });
  editor.collapse("B");
  expect(editor.snapshot().collapsed.has("B")).toBe(true);
  expect(send).not.toHaveBeenCalled();
});
