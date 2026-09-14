import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const base = "openspec/specs";
const dirs = readdirSync(base, { withFileTypes: true }).filter((d) => d.isDirectory());
const errors = [];

for (const dir of dirs) {
  const file = join(base, dir.name, "spec.md");
  let text = "";
  try {
    text = readFileSync(file, "utf8");
  } catch {
    errors.push(`${file}: missing`);
    continue;
  }
  if (!text.includes("## Purpose")) errors.push(`${file}: missing Purpose`);
  if (!text.includes("## Requirements")) errors.push(`${file}: missing Requirements`);
  if (!text.includes("### Requirement:")) errors.push(`${file}: no requirements`);
  if (!text.includes("#### Scenario:")) errors.push(`${file}: no scenarios`);
}

if (dirs.length < 10) errors.push(`Expected >=10 baseline capabilities, found ${dirs.length}`);

if (errors.length) {
  console.error("Spec validation failed:");
  errors.forEach((e) => console.error(`- ${e}`));
  process.exit(1);
}

console.log(`Specs: OK (${dirs.length} capabilities)`);
