import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { readPlanScenarioFixture, validatePlanScenario } from "./plan-scenarios.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const fixture = readPlanScenarioFixture(path.resolve(here, "../../fixtures/plans/scenarios.json"));

const planFor = (scenario) => ({
  schemaVersion: 1,
  baseSha: fixture.baseSha,
  headSha: fixture.headSha,
  fallback: scenario.fallback,
  affectedPackages: scenario.affectedPackages.map((name) => ({ name, reasons: [scenario.name] })),
  tasks: scenario.tasks,
  apps: Object.fromEntries(Object.entries(scenario.apps).map(([name, app]) => [name, { ...app, reasons: app.validate ? [scenario.name] : [] }])),
});

test("all published affected scenarios accept their exact expected plan", () => {
  for (const scenario of fixture.scenarios) {
    assert.deepEqual(validatePlanScenario(planFor(scenario), fixture, scenario.name), { ok: true, errors: [] });
  }
});

test("a missing shared consumer is rejected", () => {
  const scenario = fixture.scenarios.find(({ name }) => name === "shared-package");
  const plan = planFor(scenario);
  plan.affectedPackages = plan.affectedPackages.filter(({ name }) => name !== "@student/admin");
  plan.tasks.build = plan.tasks.build.filter((name) => name !== "@student/admin");
  plan.apps.admin = { validate: false, buildImage: false, pushImage: false, deploy: false, reasons: [] };
  assert.equal(validatePlanScenario(plan, fixture, scenario.name).ok, false);
});
