import fs from "node:fs";
import { guardDeploymentPlan } from "./deployment-plan-validator.mjs";
import { issue, sameStringSet, validationResult } from "./result.mjs";

export function validatePlanScenario(plan, fixture, scenarioName) {
  const scenario = fixture.scenarios?.find(({ name }) => name === scenarioName);
  if (!scenario) return validationResult([issue("unknown-scenario", "$.scenario", scenarioName)]);
  const guarded = guardDeploymentPlan(plan, {
    baseSha: fixture.baseSha,
    headSha: fixture.headSha,
    tasks: scenario.tasks,
    apps: scenario.apps,
  });
  const errors = [...guarded.errors];
  const actualAffected = (plan.affectedPackages ?? []).map(({ name }) => name);
  if (!sameStringSet(actualAffected, scenario.affectedPackages)) {
    errors.push(issue("affected-mismatch", "$.affectedPackages", "fixture의 expected consumer 집합과 다릅니다."));
  }
  if (
    plan.fallback?.applied !== scenario.fallback.applied ||
    plan.fallback?.reason !== scenario.fallback.reason
  ) {
    errors.push(issue("fallback-mismatch", "$.fallback", "fixture의 fallback 판정과 다릅니다."));
  }
  return validationResult(errors);
}

export function readPlanScenarioFixture(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}
