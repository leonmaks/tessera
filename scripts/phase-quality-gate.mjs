import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve, relative, sep } from "node:path";

const ROOT = process.cwd();
const CONTROL = "docs/phase-control/CURRENT_PHASE.md";
const ACTIVE_CHANGE_ROOT = "openspec/changes";
const REQUIRED_CONTROL_KEYS = [
  "ACTIVE_CHANGE",
  "ACTIVE_PHASE",
  "PHASE_STATUS",
  "BASE_COMMIT",
  "IMPLEMENTATION_MODEL",
  "TEST_FIX_MODEL",
  "REVIEW_MODEL",
  "PRE_IMPLEMENTATION_GATE",
  "POST_IMPLEMENTATION_GATE",
  "NEXT_PHASE_ALLOWED",
  "ARCHIVE_ALLOWED",
];
const STATUSES = new Set(["HANDOFF_REQUIRED", "PLANNING", "IMPLEMENTATION", "VERIFICATION", "CLOSED"]);
const PHASES = new Set(["CONTROL", ...Array.from({ length: 14 }, (_, index) => String(index).padStart(2, "0"))]);
const MODELS = {
  GLM: { label: "GLM-5.3-Flash-262k", tier: 1 },
  QWEN: { label: "Qwen3.8-Flash-Next-262k", tier: 2 },
  DEEPSEEK: { label: "DeepSeek-V4-Flash-0731-262k", tier: 3 },
  STRONGER: { label: "STRONGER_EXTERNAL_REVIEW_REQUIRED", tier: 4 },
};

const PHASE_POLICY = {
  CONTROL: { implementation: "DEEPSEEK", test: "GLM", review: "STRONGER" },
  "00": { implementation: "QWEN", test: "GLM", review: "DEEPSEEK" },
  "01": { implementation: "DEEPSEEK", test: "GLM", review: "STRONGER" },
  "02": { implementation: "DEEPSEEK", test: "QWEN", review: "DEEPSEEK" },
  "03": { implementation: "QWEN", test: "GLM", review: "DEEPSEEK" },
  "04": { implementation: "DEEPSEEK", test: "QWEN", review: "STRONGER" },
  "05": { implementation: "DEEPSEEK", test: "QWEN", review: "STRONGER" },
  "06": { implementation: "DEEPSEEK", test: "QWEN", review: "STRONGER" },
  "07": { implementation: "QWEN", test: "GLM", review: "DEEPSEEK" },
  "08": { implementation: "DEEPSEEK", test: "QWEN", review: "STRONGER" },
  "09": { implementation: "DEEPSEEK", test: "QWEN", review: "DEEPSEEK" },
  "10": { implementation: "DEEPSEEK", test: "QWEN", review: "STRONGER" },
  "11": { implementation: "DEEPSEEK", test: "QWEN", review: "STRONGER" },
  "12": { implementation: "DEEPSEEK", test: "GLM", review: "STRONGER" },
  "13": { implementation: "DEEPSEEK", test: "QWEN", review: "STRONGER" },
};

function parseArgs(argv) {
  const mode = argv.find((value) => value === "--audit" || value === "--pre" || value === "--post") ?? "--audit";
  const requestedChange = argv.find((value, index) => argv[index - 1] === "--change");
  const requestedPhase = argv.find((value, index) => argv[index - 1] === "--phase");
  return { mode, requestedChange, requestedPhase };
}

function parseControl(text) {
  const fields = {};
  const sections = { IMPLEMENTATION_SCOPE: [], PROCESS_CONTROL_SCOPE: [] };
  let section;
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trimEnd();
    const sectionMatch = /^(IMPLEMENTATION_SCOPE|PROCESS_CONTROL_SCOPE):\s*$/.exec(line);
    if (sectionMatch) {
      section = sectionMatch[1];
      continue;
    }
    const field = /^([A-Z_]+):\s*(.*)$/.exec(line);
    if (field) {
      fields[field[1]] = field[2].trim();
      section = undefined;
      continue;
    }
    const item = /^-\s+(.+)$/.exec(line.trim());
    if (item && section) sections[section].push(item[1].trim());
  }
  return { fields, sections };
}

function modelTier(value) {
  const normalized = value.toLowerCase();
  if (/stronger|external|astra|opus|frontier/.test(normalized)) return 4;
  if (/deepseek/.test(normalized)) return 3;
  if (/qwen/.test(normalized)) return 2;
  if (/glm/.test(normalized)) return 1;
  return 0;
}

function sha256(file) {
  return createHash("sha256").update(readFileSync(resolve(ROOT, file))).digest("hex");
}

function safeRelative(file) {
  const normalized = file.replaceAll("\\", "/");
  const absolute = resolve(ROOT, normalized);
  const fromRoot = relative(ROOT, absolute).replaceAll("\\", "/");
  if (!fromRoot || fromRoot.startsWith("../") || fromRoot.includes("/../")) return undefined;
  return fromRoot;
}

function git(args) {
  return execFileSync("git", args, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}

function changedFiles(baseCommit) {
  if (!/^[0-9a-f]{7,40}$/i.test(baseCommit)) return [];
  try {
    const files = new Set();
    const commands = [
      ["diff", "--name-only", "-z", baseCommit, "HEAD", "--"],
      ["diff", "--cached", "--name-only", "-z", "--"],
      ["diff", "--name-only", "-z", "--"],
      ["ls-files", "--others", "--exclude-standard", "-z"],
    ];
    for (const command of commands) for (const file of git(command).split("\0").filter(Boolean)) files.add(file.replaceAll("\\", "/"));
    return [...files].sort();
  } catch {
    return [];
  }
}

function evidenceFiles(change) {
  const root = resolve(ROOT, ACTIVE_CHANGE_ROOT, change, "evidence");
  if (!existsSync(root)) return [];
  return readdirSync(root).map((file) => `${ACTIVE_CHANGE_ROOT}/${change}/evidence/${file}`);
}

function validateReview(file, control, kind, findings) {
  if (!existsSync(resolve(ROOT, file))) {
    findings.push(`${file}: missing ${kind} review report`);
    return;
  }
  let report;
  try {
    report = JSON.parse(readFileSync(resolve(ROOT, file), "utf8"));
  } catch {
    findings.push(`${file}: invalid JSON`);
    return;
  }
  if (report.gateStatus !== "PASS") findings.push(`${file}: gateStatus must be PASS`);
  if (report.changeName !== control.ACTIVE_CHANGE) findings.push(`${file}: changeName does not match ACTIVE_CHANGE`);
  if (report.phase !== control.ACTIVE_PHASE) findings.push(`${file}: phase does not match ACTIVE_PHASE`);
  if (report.reviewerContext !== "fresh-read-only") findings.push(`${file}: reviewerContext must be fresh-read-only`);
  if (!report.reviewSession || typeof report.reviewSession !== "string") findings.push(`${file}: reviewSession is required`);
  if (!report.reviewerModel || !report.implementationModel) findings.push(`${file}: reviewerModel and implementationModel are required`);
  if (report.reviewerModel === report.implementationModel) findings.push(`${file}: reviewer and implementation model must differ`);
  if (!Array.isArray(report.preconditions) || report.preconditions.length === 0) findings.push(`${file}: preconditions are required`);
  const requiredReviewTier = modelTier(control.REVIEW_MODEL);
  if (modelTier(report.reviewerModel) < requiredReviewTier) findings.push(`${file}: reviewer model is below required review level`);
  if (!report.reviewedArtifacts || typeof report.reviewedArtifacts !== "object" || Array.isArray(report.reviewedArtifacts)) {
    findings.push(`${file}: reviewedArtifacts map is required`);
  } else {
    for (const [rawPath, expected] of Object.entries(report.reviewedArtifacts)) {
      const path = safeRelative(rawPath);
      if (!path || !existsSync(resolve(ROOT, path))) {
        findings.push(`${file}: reviewed artifact is missing or outside workspace: ${rawPath}`);
      } else if (!/^[0-9a-f]{64}$/i.test(String(expected)) || sha256(path) !== expected) {
        findings.push(`${file}: stale fingerprint for ${path}`);
      }
    }
  }
  if (kind === "post") {
    if (report.openSpecVerify !== "PASS") findings.push(`${file}: openSpecVerify must be PASS`);
    if (report.machineGate !== "PASS") findings.push(`${file}: machineGate must be PASS`);
    if (!Array.isArray(report.verification) || report.verification.length === 0) findings.push(`${file}: verification commands are required`);
    else for (const result of report.verification) if (!result.command || result.status !== "PASS") findings.push(`${file}: every verification result must have command and PASS status`);
    if (report.archiveAllowed !== true) findings.push(`${file}: archiveAllowed must be true after POST PASS`);
    if (report.parity !== "PASS") findings.push(`${file}: parity must be PASS after POST PASS`);
    if (!Array.isArray(report.postconditions) || report.postconditions.length === 0) findings.push(`${file}: postconditions are required`);
  }
}

function validateControl(control, args) {
  const findings = [];
  const { fields, sections } = control;
  for (const key of REQUIRED_CONTROL_KEYS) if (!fields[key]) findings.push(`${CONTROL}: missing ${key}`);
  if (!STATUSES.has(fields.PHASE_STATUS)) findings.push(`${CONTROL}: invalid PHASE_STATUS ${fields.PHASE_STATUS ?? "<missing>"}`);
  if (!PHASES.has(fields.ACTIVE_PHASE)) findings.push(`${CONTROL}: invalid ACTIVE_PHASE ${fields.ACTIVE_PHASE ?? "<missing>"}`);
  if (args.requestedChange && args.requestedChange !== fields.ACTIVE_CHANGE) findings.push(`requested change ${args.requestedChange} is not active`);
  if (args.requestedPhase && args.requestedPhase !== fields.ACTIVE_PHASE) findings.push(`requested phase ${args.requestedPhase} is not active`);
  if (fields.NEXT_PHASE_ALLOWED !== "false") findings.push(`${CONTROL}: NEXT_PHASE_ALLOWED must remain false until a separate handoff checkpoint`);
  if (fields.PHASE_STATUS !== "HANDOFF_REQUIRED") {
    if (!/^[0-9a-f]{7,40}$/i.test(fields.BASE_COMMIT)) findings.push(`${CONTROL}: active implementation requires a resolvable BASE_COMMIT`);
    if (sections.IMPLEMENTATION_SCOPE.length === 0) findings.push(`${CONTROL}: IMPLEMENTATION_SCOPE is empty`);
    if (sections.PROCESS_CONTROL_SCOPE.length === 0) findings.push(`${CONTROL}: PROCESS_CONTROL_SCOPE is empty`);
  }
  const policy = PHASE_POLICY[fields.ACTIVE_PHASE];
  if (!policy) findings.push(`${CONTROL}: no model policy for ${fields.ACTIVE_PHASE}`);
  else {
    const required = MODELS[policy.implementation].tier;
    if (modelTier(fields.IMPLEMENTATION_MODEL) < required) findings.push(`MODEL_SWITCH_REQUIRED: ${MODELS[policy.implementation].label} or stronger is required for implementation in ${fields.ACTIVE_PHASE}`);
    if (modelTier(fields.TEST_FIX_MODEL) < MODELS[policy.test].tier) findings.push(`MODEL_SWITCH_REQUIRED: ${MODELS[policy.test].label} or stronger is required for test/fix work in ${fields.ACTIVE_PHASE}`);
    if (modelTier(fields.REVIEW_MODEL) < MODELS[policy.review].tier) findings.push(`MODEL_SWITCH_REQUIRED: independent review requires ${MODELS[policy.review].label} or stronger`);
  }
  const changeRoot = resolve(ROOT, ACTIVE_CHANGE_ROOT, fields.ACTIVE_CHANGE ?? "");
  if (!existsSync(changeRoot)) findings.push(`active OpenSpec change does not exist: ${fields.ACTIVE_CHANGE ?? "<missing>"}`);
  else for (const file of ["proposal.md", "design.md", "tasks.md"]) if (!existsSync(resolve(changeRoot, file))) findings.push(`${changeRoot}: missing ${file}`);
  return { findings, fields, sections };
}

function scopeFindings(control, files) {
  const allowed = [...control.sections.IMPLEMENTATION_SCOPE, ...control.sections.PROCESS_CONTROL_SCOPE]
    .map((entry) => entry.replaceAll("\\", "/"))
    .filter(Boolean);
  if (allowed.length === 0) return [];
  return files.filter((file) => !allowed.some((scope) => scope.endsWith("/**") ? file.startsWith(scope.slice(0, -3)) : file === scope));
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const findings = [];
  if (!existsSync(resolve(ROOT, CONTROL))) findings.push(`${CONTROL}: missing`);
  if (findings.length === 0) {
    const control = parseControl(readFileSync(resolve(ROOT, CONTROL), "utf8"));
    const checked = validateControl(control, args);
    findings.push(...checked.findings);
    const { fields, sections } = checked;
    if (args.mode !== "--audit" && fields.PHASE_STATUS === "HANDOFF_REQUIRED") findings.push(`${CONTROL}: handoff is locked; obtain phase-specific PRE planning approval first`);
    if (args.mode === "--pre") {
      if (fields.PHASE_STATUS !== "PLANNING") findings.push(`${CONTROL}: PRE gate requires PHASE_STATUS=PLANNING`);
      validateReview(`${ACTIVE_CHANGE_ROOT}/${fields.ACTIVE_CHANGE}/evidence/pre-implementation-gate.json`, fields, "pre", findings);
    }
    if (args.mode === "--post") {
      if (fields.PHASE_STATUS !== "VERIFICATION") findings.push(`${CONTROL}: POST gate requires PHASE_STATUS=VERIFICATION`);
      validateReview(`${ACTIVE_CHANGE_ROOT}/${fields.ACTIVE_CHANGE}/evidence/pre-implementation-gate.json`, fields, "pre", findings);
      validateReview(`${ACTIVE_CHANGE_ROOT}/${fields.ACTIVE_CHANGE}/evidence/post-implementation-gate.json`, fields, "post", findings);
    }
    if (fields.PHASE_STATUS !== "HANDOFF_REQUIRED" && /^[0-9a-f]{7,40}$/i.test(fields.BASE_COMMIT)) {
      const outside = scopeFindings({ sections }, changedFiles(fields.BASE_COMMIT));
      for (const file of outside) findings.push(`${file}: changed outside approved implementation/process scope`);
    }
    if (args.mode === "--audit" && fields.PHASE_STATUS === "HANDOFF_REQUIRED") console.log("IMPLEMENTATION_LOCKED: true");
    if (args.mode === "--audit") console.log(`MODEL_RECOMMENDATION: implementation=${fields.IMPLEMENTATION_MODEL}; test/fix=${fields.TEST_FIX_MODEL}; review=${fields.REVIEW_MODEL}`);
  }
  for (const finding of findings) console.error(`FAIL ${finding}`);
  console.log(`GATE_STATUS: ${findings.length === 0 ? "PASS" : "FAIL"}`);
  process.exitCode = findings.length === 0 ? 0 : 1;
}

main();
