import fs from "node:fs";
import {
  hasOnlyKeys,
  issue,
  requireKeys,
  sameStringSet,
  stableUniqueStrings,
  validationResult,
} from "./result.mjs";

const SHA = /^[0-9a-f]{40}$/;
const TASK_KEYS = ["lint", "typecheck", "unit", "build", "e2e"];
const APP_KEYS = ["validate", "buildImage", "pushImage", "deploy", "reasons"];

export function validateDeploymentPlan(plan) {
  const errors = [];
  const required = ["schemaVersion", "baseSha", "headSha", "fallback", "affectedPackages", "tasks", "apps"];
  if (!requireKeys(plan, required, "$", errors)) return validationResult(errors);
  hasOnlyKeys(plan, required, "$", errors);
  if (plan.schemaVersion !== 1) {
    errors.push(issue("schema-version", "$.schemaVersion", "지원하는 버전은 1입니다."));
  }
  for (const field of ["baseSha", "headSha"]) {
    if (typeof plan[field] !== "string" || !SHA.test(plan[field])) {
      errors.push(issue("sha", `$.${field}`, "40자리 소문자 commit SHA여야 합니다."));
    }
  }

  if (requireKeys(plan.fallback, ["applied", "reason"], "$.fallback", errors)) {
    hasOnlyKeys(plan.fallback, ["applied", "reason"], "$.fallback", errors);
    if (typeof plan.fallback.applied !== "boolean") {
      errors.push(issue("type", "$.fallback.applied", "boolean이어야 합니다."));
    }
    if (plan.fallback.applied) {
      if (typeof plan.fallback.reason !== "string" || plan.fallback.reason.length === 0) {
        errors.push(issue("fallback-reason", "$.fallback.reason", "fallback 원인이 필요합니다."));
      }
    } else if (plan.fallback.reason !== null) {
      errors.push(issue("fallback-reason", "$.fallback.reason", "fallback 미적용 시 null이어야 합니다."));
    }
  }

  if (!Array.isArray(plan.affectedPackages)) {
    errors.push(issue("type", "$.affectedPackages", "배열이어야 합니다."));
  } else {
    const names = new Set();
    plan.affectedPackages.forEach((entry, index) => {
      const targetPath = `$.affectedPackages[${index}]`;
      if (!requireKeys(entry, ["name", "reasons"], targetPath, errors)) return;
      hasOnlyKeys(entry, ["name", "reasons"], targetPath, errors);
      if (typeof entry.name !== "string" || entry.name.length === 0) {
        errors.push(issue("type", `${targetPath}.name`, "workspace 이름이 필요합니다."));
      } else if (names.has(entry.name)) {
        errors.push(issue("duplicate", `${targetPath}.name`, "중복 workspace입니다."));
      } else {
        names.add(entry.name);
      }
      stableUniqueStrings(entry.reasons, `${targetPath}.reasons`, errors, { nonEmpty: true });
    });
  }

  if (requireKeys(plan.tasks, TASK_KEYS, "$.tasks", errors)) {
    hasOnlyKeys(plan.tasks, TASK_KEYS, "$.tasks", errors);
    for (const task of TASK_KEYS) stableUniqueStrings(plan.tasks[task], `$.tasks.${task}`, errors);
  }

  if (requireKeys(plan.apps, ["web", "admin"], "$.apps", errors)) {
    hasOnlyKeys(plan.apps, ["web", "admin"], "$.apps", errors);
    for (const appName of ["web", "admin"]) {
      const app = plan.apps[appName];
      const appPath = `$.apps.${appName}`;
      if (!requireKeys(app, APP_KEYS, appPath, errors)) continue;
      hasOnlyKeys(app, APP_KEYS, appPath, errors);
      for (const field of ["validate", "buildImage", "pushImage", "deploy"]) {
        if (typeof app[field] !== "boolean") {
          errors.push(issue("type", `${appPath}.${field}`, "boolean이어야 합니다."));
        }
      }
      stableUniqueStrings(app.reasons, `${appPath}.reasons`, errors, {
        nonEmpty: Boolean(app.validate || app.buildImage || app.pushImage || app.deploy),
      });
      if (app.buildImage && !app.validate) {
        errors.push(issue("unsafe-transition", appPath, "image build 전에 validate가 필요합니다."));
      }
      if (app.pushImage && !app.buildImage) {
        errors.push(issue("unsafe-transition", appPath, "push 전에 image build가 필요합니다."));
      }
      if (app.deploy && !app.pushImage) {
        errors.push(issue("unsafe-transition", appPath, "deploy 전에 immutable image push가 필요합니다."));
      }
    }
  }

  if (plan.fallback?.applied === true) {
    for (const appName of ["web", "admin"]) {
      if (plan.apps?.[appName]?.validate !== true) {
        errors.push(issue("unsafe-fallback", `$.apps.${appName}.validate`, "fallback에서는 두 앱을 모두 검증해야 합니다."));
      }
      if (plan.apps?.[appName]?.buildImage !== true) {
        errors.push(issue("unsafe-fallback", `$.apps.${appName}.buildImage`, "fallback에서는 두 앱 image까지 만들어야 합니다."));
      }
      if (plan.apps?.[appName]?.pushImage !== false || plan.apps?.[appName]?.deploy !== false) {
        errors.push(issue("unsafe-fallback", `$.apps.${appName}`, "영향 graph를 신뢰할 수 없는 fallback에서는 push와 deploy를 중단해야 합니다."));
      }
    }
    if (!sameStringSet(plan.tasks?.e2e, ["web", "admin"])) {
      errors.push(issue("unsafe-fallback", "$.tasks.e2e", "fallback에서는 두 앱 E2E를 모두 실행해야 합니다."));
    }
  }

  return validationResult(errors);
}

export function guardDeploymentPlan(plan, expected) {
  const errors = [...validateDeploymentPlan(plan).errors];
  if (expected.baseSha && plan.baseSha !== expected.baseSha) {
    errors.push(issue("context-mismatch", "$.baseSha", "workflow base SHA와 다릅니다."));
  }
  if (expected.headSha && plan.headSha !== expected.headSha) {
    errors.push(issue("context-mismatch", "$.headSha", "workflow head SHA와 다릅니다."));
  }
  for (const task of TASK_KEYS) {
    if (expected.tasks?.[task] && !sameStringSet(plan.tasks?.[task], expected.tasks[task])) {
      errors.push(issue("matrix-mismatch", `$.tasks.${task}`, "후속 job matrix와 plan 대상이 다릅니다."));
    }
  }
  for (const appName of ["web", "admin"]) {
    for (const field of ["validate", "buildImage", "pushImage", "deploy"]) {
      if (
        typeof expected.apps?.[appName]?.[field] === "boolean" &&
        plan.apps?.[appName]?.[field] !== expected.apps[appName][field]
      ) {
        errors.push(issue("matrix-mismatch", `$.apps.${appName}.${field}`, "후속 job matrix와 plan 값이 다릅니다."));
      }
    }
  }
  return validationResult(errors);
}

export function readAndValidateDeploymentPlan(filePath) {
  try {
    return validateDeploymentPlan(JSON.parse(fs.readFileSync(filePath, "utf8")));
  } catch (error) {
    return validationResult([issue("invalid-json", "$", error.message)]);
  }
}
