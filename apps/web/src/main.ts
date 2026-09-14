import { createElement, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { EditorBlock, createEditorController, type EditorIntent } from "@logseq-ts/editor-ui";

function App(): ReturnType<typeof createElement> {
  const [intents, setIntents] = useState<readonly EditorIntent[]>([]);
  const controller = useMemo(() => createEditorController({ send: intent => setIntents(current => [...current, intent]) }), []);
  const [collapsed, setCollapsed] = useState(false);
  return createElement("main", {},
    createElement(EditorBlock, { block: "B", controller }, "Hello world"),
    createElement("button", { type: "button", onClick: () => { controller.collapse("B"); setCollapsed(true); }, "aria-expanded": !collapsed }, "Collapse"),
    createElement("output", { "data-testid": "intents" }, JSON.stringify(intents)),
    collapsed ? createElement("output", { "data-testid": "collapsed" }, "B") : null);
}
createRoot(document.getElementById("root")!).render(createElement(App));
