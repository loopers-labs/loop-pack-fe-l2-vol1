import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  guardDeploymentPlan,
  validateDeploymentPlan,
} from "./deployment-plan-validator.mjs";
import { validateManifest } from "./manifest-validator.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const examples = path.resolve(here, "../../examples");
const load = (name) => JSON.parse(fs.readFileSync(path.join(examples, name), "utf8"));

test("manifest example satisfies the dependency-free validator", () => {
  const result = validateManifest(load("dlc.manifest.example.json"));
  assert.deepEqual(result, { ok: true, errors: [] });
});

test("manifest rejects duplicate workspaces, unsafe paths, and malformed headers", () => {
  const manifest = load("dlc.manifest.example.json");
  manifest.apps.admin.workspace = manifest.apps.web.workspace;
  manifest.apps.web.dockerfile = "../Dockerfile";
  manifest.testContracts.instanceHeader = "X Bad Header";
  const result = validateManifest(manifest);
  assert.equal(result.ok, false);
  assert.deepEqual(
    new Set(result.errors.map(({ code }) => code)),
    new Set(["duplicate-workspace", "unsafe-path", "format"]),
  );
});

test("deployment plan example satisfies ordering invariants", () => {
  const result = validateDeploymentPlan(load("deployment-plan.example.json"));
  assert.deepEqual(result, { ok: true, errors: [] });
});

test("deployment plan rejects unsafe transitions and partial fallback", () => {
  const plan = load("deployment-plan.example.json");
  plan.fallback = { applied: true, reason: "missing-base" };
  plan.apps.web = {
    validate: false,
    buildImage: true,
    pushImage: true,
    deploy: true,
    reasons: ["unsafe"],
  };
  const result = validateDeploymentPlan(plan);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some(({ code }) => code === "unsafe-transition"));
  assert.ok(result.errors.filter(({ code }) => code === "unsafe-fallback").length >= 2);
});

test("fallback validates and builds both apps but fails closed before push", () => {
  const plan = load("deployment-plan.example.json");
  plan.fallback = { applied: true, reason: "missing-base" };
  plan.tasks.e2e = ["web", "admin"];
  for (const app of ["web", "admin"]) {
    plan.apps[app] = {
      validate: true,
      buildImage: true,
      pushImage: false,
      deploy: false,
      reasons: ["fallback"],
    };
  }
  assert.deepEqual(validateDeploymentPlan(plan), { ok: true, errors: [] });

  plan.apps.web.pushImage = true;
  plan.apps.web.deploy = true;
  const unsafe = validateDeploymentPlan(plan);
  assert.equal(unsafe.ok, false);
  assert.ok(unsafe.errors.some(({ code, path }) => code === "unsafe-fallback" && path === "$.apps.web"));
});

test("plan guard requires exact workflow SHAs and task/app matrices", () => {
  const plan = load("deployment-plan.example.json");
  const pass = guardDeploymentPlan(plan, {
    baseSha: plan.baseSha,
    headSha: plan.headSha,
    tasks: plan.tasks,
    apps: plan.apps,
  });
  assert.equal(pass.ok, true);

  const fail = guardDeploymentPlan(plan, {
    headSha: "f".repeat(40),
    tasks: { build: ["@student/admin"] },
    apps: { web: { deploy: true } },
  });
  assert.equal(fail.ok, false);
  assert.equal(fail.errors.filter(({ code }) => code === "matrix-mismatch").length, 2);
  assert.equal(fail.errors.filter(({ code }) => code === "context-mismatch").length, 1);
});
