import { setWorldConstructor, World } from "@cucumber/cucumber";

export class ParityWorld extends World {
  graph: unknown = undefined;
  lastError: unknown = undefined;
  beforeSnapshot: unknown = undefined;

  requireHarness(): never {
    throw new Error(
      "BDD harness not implemented for this phase. Implement the phase test adapter before production code."
    );
  }
}

setWorldConstructor(ParityWorld);
