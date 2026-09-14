import { createElement, type KeyboardEvent } from "react";

export type EditorIntent =
  | { readonly kind: "split"; readonly block: string; readonly offset: number }
  | { readonly kind: "merge-previous"; readonly block: string }
  | { readonly kind: "indent"; readonly blocks: readonly string[] }
  | { readonly kind: "outdent"; readonly blocks: readonly string[] }
  | { readonly kind: "delete"; readonly block: string };
export interface EditorGateway { send(intent: EditorIntent): void | Promise<void>; reloadChildren?(parent: string): void | Promise<void>; }
export interface EditorState { readonly focus?: { readonly block: string; readonly offset: number }; readonly selected: ReadonlySet<string>; readonly collapsed: ReadonlySet<string>; }
export interface EditorController { focus(block: string, offset: number): void; select(block: string, additive?: boolean): void; collapse(block: string): void; expand(block: string): void; key(key: "Enter" | "Backspace" | "Delete" | "Tab", shiftKey?: boolean): void; requestReload(parent: string, stale: boolean): void; snapshot(): EditorState; }

export function createEditorController(gateway: EditorGateway): EditorController {
  let focus: EditorState["focus"];
  let selected = new Set<string>();
  let collapsed = new Set<string>();
  return {
    focus(block, offset) { if (!Number.isInteger(offset) || offset < 0) throw new Error("Invalid caret offset"); focus = { block, offset }; selected = new Set([block]); },
    select(block, additive = false) { selected = additive ? new Set([...selected, block]) : new Set([block]); },
    collapse(block) { collapsed = new Set([...collapsed, block]); },
    expand(block) { collapsed = new Set([...collapsed].filter(value => value !== block)); },
    key(key, shiftKey = false) {
      const activeFocus = focus;
      if (!activeFocus) return;
      if (key === "Enter") void gateway.send({ kind: "split", block: activeFocus.block, offset: activeFocus.offset });
      else if (key === "Backspace") void gateway.send({ kind: "merge-previous", block: activeFocus.block });
      else if (key === "Delete") void gateway.send({ kind: "delete", block: activeFocus.block });
      else void gateway.send({ kind: shiftKey ? "outdent" : "indent", blocks: [...selected] });
    },
    requestReload(parent, stale) { if (stale) void gateway.reloadChildren?.(parent); },
    snapshot() { return Object.freeze({ ...(focus === undefined ? {} : { focus: Object.freeze({ ...focus }) }), selected: new Set(selected), collapsed: new Set(collapsed) }); }
  };
}

/** Minimal React boundary: it renders interaction controls but never imports graph storage. */
export function EditorBlock(props: { readonly block: string; readonly controller: EditorController; readonly children?: string }): ReturnType<typeof createElement> {
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" || event.key === "Backspace" || event.key === "Delete" || event.key === "Tab") { event.preventDefault(); props.controller.key(event.key, event.shiftKey); }
  };
  return createElement("div", { role: "textbox", tabIndex: 0, "data-block": props.block, onFocus: () => props.controller.focus(props.block, 0), onKeyDown }, props.children ?? "");
}
