import { readFileSync } from "node:fs";

const roadmap = readFileSync("docs/IMPLEMENTATION-ROADMAP.md", "utf8");
const phases = [...roadmap.matchAll(/^## (Phase \d+[^\n]*)/gm)].map((m) => m[1]);
console.log("Implementation phases:");
for (const p of phases) console.log(`- ${p}`);
console.log("\nUse codex/PHASE-CHECKLIST.md and complete phases in order.");
