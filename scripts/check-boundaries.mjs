import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { checkSource } from "./boundary-rules.mjs";

const root = process.cwd();

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    if (name.name === "node_modules" || name.name === "dist" || name.name === ".reference") continue;
    const p = join(dir, name.name);
    if (name.isDirectory()) out.push(...walk(p));
    else if (/\.(ts|tsx)$/.test(name.name)) out.push(p);
  }
  return out;
}

const violations = [];

for (const file of walk(root)) {
  const rel = relative(root, file).replaceAll("\\", "/");
  const source = readFileSync(file, "utf8");
  for (const message of checkSource(rel, source)) violations.push(`${rel}: ${message}`);
}

if (violations.length) {
  console.error("Architecture boundary violations:");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}
console.log("Architecture boundaries: OK");
