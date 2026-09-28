import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const script = "scripts/phase-quality-gate.mjs";
const absoluteScript = resolve(process.cwd(), script);

function hashFile(file: string): string {
  return createHash("sha256").update(readFileSync(file)).digest("hex");
}

function createFixture(status: "PLANNING" | "VERIFICATION" = "PLANNING"): string {
  const root = mkdtempSync(join(tmpdir(), "tessera-phase-gate-"));
  mkdirSync(join(root, "docs/phase-control"), { recursive: true });
  mkdirSync(join(root, "openspec/changes/fixture/evidence"), { recursive: true });
  writeFileSync(join(root, "openspec/changes/fixture/proposal.md"), "# Proposal\n");
  writeFileSync(join(root, "openspec/changes/fixture/design.md"), "# Design\n");
  writeFileSync(join(root, "openspec/changes/fixture/tasks.md"), "# Tasks\n");
  writeFileSync(
    join(root, "docs/phase-control/CURRENT_PHASE.md"),
    `ACTIVE_CHANGE: fixture\nACTIVE_PHASE: 00\nPHASE_STATUS: ${status}\nBASE_COMMIT: 0000000\nIMPLEMENTATION_MODEL: Qwen3.8-Flash-Next-262k\nTEST_FIX_MODEL: GLM-5.3-Flash-262k\nREVIEW_MODEL: DeepSeek-V4-Flash-0731-262k\nPRE_IMPLEMENTATION_GATE: REQUIRED\nPOST_IMPLEMENTATION_GATE: REQUIRED\nNEXT_PHASE_ALLOWED: false\nARCHIVE_ALLOWED: false\n\nIMPLEMENTATION_SCOPE:\n- src/**\n\nPROCESS_CONTROL_SCOPE:\n- docs/phase-control/CURRENT_PHASE.md\n- openspec/changes/fixture/**\n`,
  );
  return root;
}

function runGate(root: string, mode: "--pre" | "--post") {
  const result = spawnSync(process.execPath, [absoluteScript, mode], { cwd: root, encoding: "utf8" });
  return { ...result, output: `${result.stdout}\n${result.stderr}` };
}

function writeReview(root: string, kind: "pre" | "post", overrides: Record<string, unknown> = {}) {
  const controlFile = join(root, "docs/phase-control/CURRENT_PHASE.md");
  const report: Record<string, unknown> = {
    gateStatus: "PASS",
    changeName: "fixture",
    phase: "00",
    reviewerContext: "fresh-read-only",
    reviewSession: `${kind}-fixture-review`,
    reviewerModel: "DeepSeek-V4-Flash-0731-262k",
    implementationModel: "Qwen3.8-Flash-Next-262k",
    reviewedArtifacts: { "docs/phase-control/CURRENT_PHASE.md": hashFile(controlFile) },
    preconditions: ["OpenSpec plan is frozen"],
    ...overrides,
  };
  if (kind === "post") {
    report.openSpecVerify = "PASS";
    report.machineGate = "PASS";
    report.parity = "PASS";
    report.verification = [{ command: "pnpm verify", status: "PASS" }];
    report.postconditions = ["All exit criteria are evidenced"];
    report.archiveAllowed = true;
  }
  writeFileSync(join(root, `openspec/changes/fixture/evidence/${kind}-implementation-gate.json`), JSON.stringify(report));
}

describe("phase quality gate", () => {
  it("passes the locked handoff audit and reports the implementation lock", () => {
    const result = spawnSync(process.execPath, [script, "--audit"], { encoding: "utf8" });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("IMPLEMENTATION_LOCKED: true");
    expect(result.stdout).toContain("GATE_STATUS: PASS");
  });

  it("rejects PRE while the repository is awaiting handoff approval", () => {
    const result = spawnSync(process.execPath, [script, "--pre"], { encoding: "utf8" });
    const output = `${result.stdout}\n${result.stderr}`;

    expect(result.status).toBe(1);
    expect(output).toContain("handoff is locked");
    expect(output).toContain("GATE_STATUS: FAIL");
  });

  it("rejects missing PRE evidence", () => {
    const root = createFixture();
    try {
      const result = runGate(root, "--pre");
      expect(result.status).toBe(1);
      expect(result.output).toContain("missing pre review report");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("rejects stale fingerprints", () => {
    const root = createFixture();
    try {
      writeReview(root, "pre", { reviewedArtifacts: { "docs/phase-control/CURRENT_PHASE.md": "0".repeat(64) } });
      const result = runGate(root, "--pre");
      expect(result.status).toBe(1);
      expect(result.output).toContain("stale fingerprint");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("rejects implementer self-approval", () => {
    const root = createFixture();
    try {
      writeReview(root, "pre", { reviewerModel: "Qwen3.8-Flash-Next-262k" });
      const result = runGate(root, "--pre");
      expect(result.status).toBe(1);
      expect(result.output).toContain("reviewer and implementation model must differ");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("accepts a complete independent POST checkpoint", () => {
    const root = createFixture("VERIFICATION");
    try {
      writeReview(root, "pre");
      writeReview(root, "post");
      const result = runGate(root, "--post");
      expect(result.status).toBe(0);
      expect(result.output).toContain("GATE_STATUS: PASS");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("emits exactly one machine-readable gate status", () => {
    const output = execFileSync(process.execPath, [script, "--audit"], { encoding: "utf8" });
    expect(output.match(/^GATE_STATUS: (PASS|FAIL)$/gm)).toEqual(["GATE_STATUS: PASS"]);
  });
});
