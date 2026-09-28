import { expect, it } from "vitest";
import { loadConfiguration, loadSources } from "@cucumber/cucumber/api";

it("discovers Phase 00 scenarios with the actual CLI configuration", async () => {
  const { runConfiguration } = await loadConfiguration({ file: "cucumber.mjs", provided: { tags: "@phase00" } });
  const sources = await loadSources(runConfiguration.sources);
  expect(sources.errors).toEqual([]);
  expect(sources.plan).toHaveLength(9);
  expect(runConfiguration.support.importPaths).toContain("tests/bdd/steps/**/*.ts");
});
