import { Given } from "@cucumber/cucumber";
import type { ParityWorld } from "../support/world.js";

/**
 * Bootstrap-only fallback.
 *
 * Cucumber does not distinguish Given/When/Then when matching definitions, so
 * one catch-all expression is sufficient. Replace it with real public-harness
 * steps when activating a phase.
 */
Given(/^(?!harness ).+$/, function (this: ParityWorld) {
  return this.requireHarness();
});
