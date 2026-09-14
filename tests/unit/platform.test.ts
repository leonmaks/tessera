import { expect, it } from "vitest";
import { SequenceClock, SequenceUUIDGenerator } from "../../packages/platform/src/index.js";

it("replays finite independent sequences and rejects exhaustion", () => {
  const ids = ["00000000-0000-4000-8000-000000000001", "00000000-0000-4000-8000-000000000002"];
  const left = new SequenceUUIDGenerator(ids);
  const right = new SequenceUUIDGenerator(ids);
  expect([left.next(), left.next()]).toEqual([right.next(), right.next()]);
  expect(() => left.next()).toThrow("exhausted");
  const ticks = [100, 200];
  const clock = new SequenceClock(ticks);
  ticks[0] = 999;
  expect([clock.now(), clock.now()]).toEqual([100, 200]);
  expect(() => clock.now()).toThrow("exhausted");
});

it("rejects malformed deterministic inputs", () => {
  expect(() => new SequenceUUIDGenerator(["bad"])).toThrow();
  expect(() => new SequenceClock([NaN])).toThrow();
});
