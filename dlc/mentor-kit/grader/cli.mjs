#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { readAndValidateDeploymentPlan } from "./deployment-plan-validator.mjs";
import { readAndValidateManifest } from "./manifest-validator.mjs";
import { checkWorkspaceBoundaries } from "./workspace-boundaries.mjs";
import { readAndValidateComposeNetworkPolicy } from "./network-policy.mjs";
import { readPlanScenarioFixture, validatePlanScenario } from "./plan-scenarios.mjs";
import { runManifestCommands } from "./command-runner.mjs";

function option(name, fallback = null) {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : process.argv[index + 1];
}

function emit(result) {
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  process.exitCode = result.ok ? 0 : 1;
}

const command = process.argv[2];
if (command === "validate-manifest") {
  const file = path.resolve(option("--file", "dlc.manifest.json"));
  emit(readAndValidateManifest(file, {
    root: path.resolve(option("--root", ".")),
    checkFiles: process.argv.includes("--check-files"),
  }));
} else if (command === "validate-plan") {
  emit(readAndValidateDeploymentPlan(path.resolve(option("--file", "deployment-plan.json"))));
} else if (command === "boundaries") {
  const root = path.resolve(option("--root", "."));
  const manifestPath = path.resolve(option("--manifest", path.join(root, "dlc.manifest.json")));
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  emit(checkWorkspaceBoundaries(root, manifest));
} else if (command === "network-policy") {
  emit(readAndValidateComposeNetworkPolicy(
    path.resolve(option("--file", "compose.config.json")),
    {
      webService: option("--web", "web"),
      adminService: option("--admin", "admin"),
      sharedServices: option("--shared", "commerce-api,analytics-sink").split(",").filter(Boolean),
    },
  ));
} else if (command === "plan-scenario") {
  const plan = JSON.parse(fs.readFileSync(path.resolve(option("--file", "deployment-plan.json")), "utf8"));
  const fixture = readPlanScenarioFixture(path.resolve(option("--fixture", "dlc/fixtures/plans/scenarios.json")));
  emit(validatePlanScenario(plan, fixture, option("--scenario")));
} else if (command === "run-commands") {
  const root = path.resolve(option("--root", "."));
  const manifestPath = path.resolve(option("--manifest", path.join(root, "dlc.manifest.json")));
  const validation = readAndValidateManifest(manifestPath, { root, checkFiles: false });
  if (!validation.ok) {
    emit(validation);
  } else {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    const names = option("--commands", "boundaries,plan,verify,runtime").split(",").filter(Boolean);
    emit(await runManifestCommands({ root, manifest, names }));
  }
} else {
  process.stderr.write(
    "usage: cli.mjs <validate-manifest|validate-plan|boundaries|network-policy|plan-scenario|run-commands> [options]\n",
  );
  process.exitCode = 2;
}
