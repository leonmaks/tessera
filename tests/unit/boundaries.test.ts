import { expect, it } from "vitest";
import { checkSource } from "../../scripts/boundary-rules.mjs";

it.each([
  ["apps/web/src/index.ts", 'import db from "@tessera-ts/graph-db";'],
  ["apps/web/src/index.ts", 'export * from "../../../packages/graph-db/src/index.js";'],
  ["packages/plugin-sdk/src/index.ts", 'const db = import("@tessera-ts/graph-db");'],
  ["packages/sync-protocol/src/index.ts", 'import type { DB } from "../../graph-db/src/index.js";'],
  ["packages/outliner/src/index.ts", 'import x from "@tessera-ts/domain/src/types";'],
  ["packages/domain/src/index.ts", 'import React from "react";'],
  ["packages/domain/src/index.ts", 'const x = window.location;'],
  ["packages/domain/src/index.ts", 'const x = globalThis.document;']
])("rejects forbidden dependency in %s: %s", (file, source) => {
  expect(checkSource(file, source).length).toBeGreaterThan(0);
});

it("allows public imports, same-package imports and harmless comments", () => {
  expect(checkSource("apps/web/src/index.ts", '// import "@tessera-ts/graph-db"\nimport x from "@tessera-ts/graph-client";')).toEqual([]);
  expect(checkSource("apps/web/src/browser.worker.ts", 'import db from "@tessera-ts/graph-db/browser-opfs";')).toEqual([]);
  expect(checkSource("packages/domain/src/index.ts", 'export * from "./types.js"; const note = "window";')).toEqual([]);
});
