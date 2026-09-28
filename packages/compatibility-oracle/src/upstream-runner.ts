import { execFileSync, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod";

const pinSchema = z.object({
  repository: z.url(),
  commit: z.string().regex(/^[0-9a-f]{40}$/),
  status: z.literal("PINNED")
});

export interface PinnedUpstream {
  readonly repository: string;
  readonly commit: string;
  readonly path: string;
}

export interface UpstreamCommandResult {
  readonly command: readonly string[];
  readonly path: string;
  readonly stdout: string;
  readonly stderr: string;
}

type GitExecutor = (file: string, args: readonly string[], options: { readonly cwd: string; readonly encoding: "utf8" }) => string;

function defaultGit(file: string, args: readonly string[], options: { readonly cwd: string; readonly encoding: "utf8" }): string {
  return execFileSync(file, args, options);
}

/** Verifies that a local checkout is exactly the baseline used for parity. */
export function inspectPinnedUpstream(baseline: unknown, checkoutPath: string, git: GitExecutor = defaultGit): PinnedUpstream {
  const pin = pinSchema.parse(baseline);
  const path = resolve(checkoutPath);
  if (!existsSync(path)) throw new Error(`UPSTREAM_CHECKOUT_MISSING: ${path}`);
  const actual = git("git", ["rev-parse", "HEAD"], { cwd: path, encoding: "utf8" }).trim();
  if (actual !== pin.commit) throw new Error(`UPSTREAM_CHECKOUT_MISMATCH: expected ${pin.commit}, got ${actual}`);
  return { repository: pin.repository, commit: pin.commit, path };
}

/** Runs a declared upstream command only after its checkout has passed pin verification. */
export function runPinnedUpstream(upstream: PinnedUpstream, command: readonly [string, ...string[]]): UpstreamCommandResult {
  const [file, ...args] = command;
  const result = spawnSync(file, args, { cwd: upstream.path, encoding: "utf8", shell: false });
  if (result.error !== undefined) throw new Error(`UPSTREAM_COMMAND_FAILED: ${result.error.message}`);
  if (result.status !== 0) throw new Error(`UPSTREAM_COMMAND_FAILED: ${command.join(" ")} exited ${String(result.status)}`);
  return { command, path: upstream.path, stdout: result.stdout ?? "", stderr: result.stderr ?? "" };
}
