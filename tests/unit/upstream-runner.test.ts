import { describe, expect, it } from "vitest";
import { inspectPinnedUpstream } from "../../packages/compatibility-oracle/src/index.js";

const pin = { repository: "https://github.com/logseq/logseq.git", commit: "b".repeat(40), status: "PINNED" };

describe("pinned upstream runner", () => {
  it("rejects a checkout that is not the declared baseline before a command can run", () => {
    expect(() => inspectPinnedUpstream(pin, ".", () => "a".repeat(40))).toThrow("UPSTREAM_CHECKOUT_MISMATCH");
  });

  it("returns a verified checkout only for the exact declared SHA", () => {
    const upstream = inspectPinnedUpstream(pin, ".", () => `${pin.commit}\n`);
    expect(upstream).toMatchObject({ repository: pin.repository, commit: pin.commit });
  });
});
