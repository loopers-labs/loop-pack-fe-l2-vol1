import fs from "node:fs";
import path from "node:path";
import {
  hasOnlyKeys,
  isPlainObject,
  issue,
  requireKeys,
  validationResult,
} from "./result.mjs";
import { discoverWorkspaces } from "./workspace-boundaries.mjs";

const APP_KEYS = [
  "workspace",
  "dockerfile",
  "dockerTarget",
  "baseUrlEnv",
  "internalBaseUrlEnv",
  "healthPath",
  "readinessPath",
  "viewerPath",
];
const ACCOUNT_KEYS = ["customerA", "customerB", "adminA", "adminB"];
const CONTRACT_REQUIRED = [
  "analyticsSinkUrlEnv",
  "instanceHeader",
  "requestHeader",
  "graderEnabledEnv",
  "graderTokenEnv",
  "graderTokenHeader",
  "sessionFixturePath",
  "barrierHeader",
];
const COMMAND_KEYS = ["boundaries", "plan", "verify", "runtime"];

const envName = /^[A-Z][A-Z0-9_]*$/;
const headerName = /^[a-z0-9][a-z0-9-]*$/;

function validateString(value, targetPath, errors, pattern = null) {
  if (typeof value !== "string" || value.length === 0) {
    errors.push(issue("type", targetPath, "비어 있지 않은 문자열이어야 합니다."));
  } else if (pattern && !pattern.test(value)) {
    errors.push(issue("format", targetPath, "형식이 올바르지 않습니다."));
  }
}

function validateHttpPath(value, targetPath, errors) {
  validateString(value, targetPath, errors);
  if (typeof value === "string" && (!value.startsWith("/") || value.startsWith("//"))) {
    errors.push(issue("format", targetPath, "단일 /로 시작하는 HTTP path여야 합니다."));
  }
}

function validateRepoPath(value, targetPath, errors) {
  validateString(value, targetPath, errors);
  if (
    typeof value === "string" &&
    (path.isAbsolute(value) || value.split(/[\\/]/).includes(".."))
  ) {
    errors.push(issue("unsafe-path", targetPath, "repository 내부 상대 경로여야 합니다."));
  }
}

export function validateManifest(manifest, options = {}) {
  const errors = [];
  if (!requireKeys(manifest, ["schemaVersion", "apps", "accounts", "testContracts", "commands"], "$", errors)) {
    return validationResult(errors);
  }
  hasOnlyKeys(manifest, ["schemaVersion", "apps", "accounts", "testContracts", "commands"], "$", errors);
  if (manifest.schemaVersion !== 1) {
    errors.push(issue("schema-version", "$.schemaVersion", "지원하는 버전은 1입니다."));
  }

  if (requireKeys(manifest.apps, ["web", "admin"], "$.apps", errors)) {
    hasOnlyKeys(manifest.apps, ["web", "admin"], "$.apps", errors);
    for (const appName of ["web", "admin"]) {
      const app = manifest.apps[appName];
      const appPath = `$.apps.${appName}`;
      if (!requireKeys(app, APP_KEYS, appPath, errors)) continue;
      hasOnlyKeys(app, APP_KEYS, appPath, errors);
      validateString(app.workspace, `${appPath}.workspace`, errors);
      validateRepoPath(app.dockerfile, `${appPath}.dockerfile`, errors);
      if (app.dockerTarget !== null) {
        validateString(app.dockerTarget, `${appPath}.dockerTarget`, errors);
      }
      validateString(app.baseUrlEnv, `${appPath}.baseUrlEnv`, errors, envName);
      validateString(app.internalBaseUrlEnv, `${appPath}.internalBaseUrlEnv`, errors, envName);
      for (const field of ["healthPath", "readinessPath", "viewerPath"]) {
        validateHttpPath(app[field], `${appPath}.${field}`, errors);
      }
    }
    if (
      isPlainObject(manifest.apps.web) &&
      isPlainObject(manifest.apps.admin) &&
      manifest.apps.web.workspace === manifest.apps.admin.workspace
    ) {
      errors.push(issue("duplicate-workspace", "$.apps", "web과 admin workspace는 달라야 합니다."));
    }
  }

  if (requireKeys(manifest.accounts, ACCOUNT_KEYS, "$.accounts", errors)) {
    hasOnlyKeys(manifest.accounts, ACCOUNT_KEYS, "$.accounts", errors);
    for (const key of ACCOUNT_KEYS) {
      validateString(manifest.accounts[key], `$.accounts.${key}`, errors);
    }
    const aliases = ACCOUNT_KEYS.map((key) => manifest.accounts[key]);
    if (aliases.every((value) => typeof value === "string") && new Set(aliases).size !== aliases.length) {
      errors.push(issue("duplicate-account", "$.accounts", "account alias는 모두 달라야 합니다."));
    }
  }

  if (requireKeys(manifest.testContracts, CONTRACT_REQUIRED, "$.testContracts", errors)) {
    hasOnlyKeys(
      manifest.testContracts,
      CONTRACT_REQUIRED,
      "$.testContracts",
      errors,
    );
    validateString(
      manifest.testContracts.analyticsSinkUrlEnv,
      "$.testContracts.analyticsSinkUrlEnv",
      errors,
      envName,
    );
    for (const field of ["graderEnabledEnv", "graderTokenEnv"]) {
      validateString(manifest.testContracts[field], `$.testContracts.${field}`, errors, envName);
    }
    for (const field of ["instanceHeader", "requestHeader", "graderTokenHeader", "barrierHeader"]) {
      validateString(manifest.testContracts[field], `$.testContracts.${field}`, errors, headerName);
    }
    validateHttpPath(manifest.testContracts.sessionFixturePath, "$.testContracts.sessionFixturePath", errors);
    if (manifest.testContracts.sessionFixturePath !== "/api/__dlc/session") {
      errors.push(issue("fixture-route", "$.testContracts.sessionFixturePath", "고정 route /api/__dlc/session을 사용해야 합니다."));
    }
  }

  if (requireKeys(manifest.commands, COMMAND_KEYS, "$.commands", errors)) {
    hasOnlyKeys(manifest.commands, COMMAND_KEYS, "$.commands", errors);
    for (const command of COMMAND_KEYS) {
      validateString(manifest.commands[command], `$.commands.${command}`, errors);
      if (typeof manifest.commands[command] === "string" && /[\r\n\0]/.test(manifest.commands[command])) {
        errors.push(issue("unsafe-command", `$.commands.${command}`, "command에 줄바꿈이나 NUL을 넣을 수 없습니다."));
      }
    }
  }

  if (options.root && options.checkFiles) {
    const root = path.resolve(options.root);
    let workspaces = [];
    try {
      workspaces = discoverWorkspaces(root);
    } catch (error) {
      errors.push(issue("workspace-discovery", "$", error.message));
    }
    const names = new Set(workspaces.map((workspace) => workspace.name));
    for (const appName of ["web", "admin"]) {
      const app = manifest.apps?.[appName];
      if (!isPlainObject(app)) continue;
      if (!names.has(app.workspace)) {
        errors.push(issue("unknown-workspace", `$.apps.${appName}.workspace`, `${app.workspace} workspace를 찾지 못했습니다.`));
      }
      if (typeof app.dockerfile === "string" && !fs.existsSync(path.join(root, app.dockerfile))) {
        errors.push(issue("missing-dockerfile", `$.apps.${appName}.dockerfile`, `${app.dockerfile} 파일이 없습니다.`));
      }
    }
  }

  return validationResult(errors);
}

export function readAndValidateManifest(filePath, options = {}) {
  let value;
  try {
    value = JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    return validationResult([issue("invalid-json", "$", error.message)]);
  }
  return validateManifest(value, options);
}
