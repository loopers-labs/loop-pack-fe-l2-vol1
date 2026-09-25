import fs from "node:fs";
import path from "node:path";
import { validationResult } from "./result.mjs";

const SOURCE_EXTENSIONS = new Set([".js", ".jsx", ".mjs", ".cjs", ".ts", ".tsx", ".mts", ".cts"]);
const DEPENDENCY_FIELDS = ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"];

function posix(value) {
  return value.split(path.sep).join("/");
}

function walk(directory, visitor) {
  if (!fs.existsSync(directory)) return;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if ([".git", "node_modules", ".next", "dist", "coverage"].includes(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(absolute, visitor);
    else visitor(absolute);
  }
}

function globRegex(pattern) {
  let source = "";
  for (let index = 0; index < pattern.length; index += 1) {
    const character = pattern[index];
    if (character === "*" && pattern[index + 1] === "*") {
      source += ".*";
      index += 1;
    } else if (character === "*") {
      source += "[^/]*";
    } else if (character === "?") {
      source += "[^/]";
    } else {
      source += character.replace(/[|\\{}()[\]^$+?.]/g, "\\$&");
    }
  }
  return new RegExp(`^${source}/?$`);
}

function workspacePatterns(root) {
  const file = path.join(root, "pnpm-workspace.yaml");
  if (!fs.existsSync(file)) throw new Error("pnpm-workspace.yaml이 없습니다.");
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  const patterns = [];
  let inPackages = false;
  for (const line of lines) {
    if (/^packages\s*:/.test(line)) {
      inPackages = true;
      continue;
    }
    if (inPackages && /^[^\s#]/.test(line)) break;
    if (!inPackages) continue;
    const match = line.match(/^\s*-\s*["']?([^"'#]+?)["']?\s*(?:#.*)?$/);
    if (match) patterns.push(match[1].trim());
  }
  return patterns;
}

export function discoverWorkspaces(root) {
  const absoluteRoot = path.resolve(root);
  const patterns = workspacePatterns(absoluteRoot);
  const include = patterns.filter((pattern) => !pattern.startsWith("!")).map(globRegex);
  const exclude = patterns.filter((pattern) => pattern.startsWith("!")).map((pattern) => globRegex(pattern.slice(1)));
  const workspaces = [];
  walk(absoluteRoot, (file) => {
    if (path.basename(file) !== "package.json") return;
    const directory = path.dirname(file);
    if (directory === absoluteRoot) return;
    const relative = posix(path.relative(absoluteRoot, directory));
    if (!include.some((pattern) => pattern.test(relative))) return;
    if (exclude.some((pattern) => pattern.test(relative))) return;
    const manifest = JSON.parse(fs.readFileSync(file, "utf8"));
    if (typeof manifest.name !== "string" || manifest.name.length === 0) {
      throw new Error(`${relative}/package.json에 name이 없습니다.`);
    }
    workspaces.push({ name: manifest.name, root: directory, relative, manifest });
  });
  return workspaces.sort((left, right) => left.name.localeCompare(right.name));
}

function stripJsonComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1")
    .replace(/,\s*([}\]])/g, "$1");
}

function loadAliases(root, workspace) {
  const aliases = [];
  for (const configPath of [path.join(root, "tsconfig.json"), path.join(workspace.root, "tsconfig.json")]) {
    if (!fs.existsSync(configPath)) continue;
    let config;
    try {
      config = JSON.parse(stripJsonComments(fs.readFileSync(configPath, "utf8")));
    } catch {
      continue;
    }
    const compiler = config.compilerOptions ?? {};
    const baseUrl = path.resolve(path.dirname(configPath), compiler.baseUrl ?? ".");
    for (const [key, targets] of Object.entries(compiler.paths ?? {})) {
      for (const target of Array.isArray(targets) ? targets : []) {
        aliases.push({ key, target, baseUrl });
      }
    }
  }
  return aliases;
}

function matchAlias(specifier, alias) {
  const star = alias.key.indexOf("*");
  if (star === -1) return specifier === alias.key ? "" : null;
  const prefix = alias.key.slice(0, star);
  const suffix = alias.key.slice(star + 1);
  if (!specifier.startsWith(prefix) || !specifier.endsWith(suffix)) return null;
  return specifier.slice(prefix.length, specifier.length - suffix.length);
}

function resolveAlias(specifier, aliases) {
  for (const alias of aliases) {
    const wildcard = matchAlias(specifier, alias);
    if (wildcard === null) continue;
    const target = alias.target.replace("*", wildcard);
    return path.resolve(alias.baseUrl, target);
  }
  return null;
}

function workspaceForPath(absolutePath, workspaces) {
  const normalized = path.resolve(absolutePath);
  return workspaces
    .filter((workspace) => normalized === workspace.root || normalized.startsWith(`${workspace.root}${path.sep}`))
    .sort((left, right) => right.root.length - left.root.length)[0] ?? null;
}

function workspaceForSpecifier(specifier, workspaces) {
  return workspaces
    .filter((workspace) => specifier === workspace.name || specifier.startsWith(`${workspace.name}/`))
    .sort((left, right) => right.name.length - left.name.length)[0] ?? null;
}

function declaredDependencies(workspace) {
  return new Set(
    DEPENDENCY_FIELDS.flatMap((field) => Object.keys(workspace.manifest[field] ?? {})),
  );
}

function exportKeys(workspace) {
  const exportsValue = workspace.manifest.exports;
  if (typeof exportsValue === "string" || Array.isArray(exportsValue)) return ["."];
  if (!exportsValue || typeof exportsValue !== "object") return [];
  const keys = Object.keys(exportsValue);
  return keys.some((key) => key.startsWith(".")) ? keys : ["."];
}

function isExported(workspace, specifier) {
  const suffix = specifier.slice(workspace.name.length);
  const requested = suffix.length === 0 ? "." : `.${suffix}`;
  return exportKeys(workspace).some((key) => {
    if (key === requested) return true;
    if (!key.includes("*")) return false;
    const [prefix, tail] = key.split("*");
    return requested.startsWith(prefix) && requested.endsWith(tail);
  });
}

function importSpecifiers(source) {
  const values = [];
  const patterns = [
    /\b(?:import|export)\s+(?:type\s+)?(?:[^'";]*?\s+from\s+)?["']([^"']+)["']/g,
    /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g,
    /\brequire\s*\(\s*["']([^"']+)["']\s*\)/g,
  ];
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) values.push(match[1]);
  }
  return [...new Set(values)];
}

function internalEdges(workspaces) {
  const names = new Set(workspaces.map((workspace) => workspace.name));
  return new Map(
    workspaces.map((workspace) => [
      workspace.name,
      [...declaredDependencies(workspace)].filter((dependency) => names.has(dependency)),
    ]),
  );
}

function cycleFindings(workspaces) {
  const edges = internalEdges(workspaces);
  const state = new Map();
  const stack = [];
  const found = new Set();
  function visit(name) {
    if (state.get(name) === "done") return;
    if (state.get(name) === "visiting") {
      const start = stack.indexOf(name);
      const cycle = [...stack.slice(start), name];
      found.add(cycle.join(" -> "));
      return;
    }
    state.set(name, "visiting");
    stack.push(name);
    for (const next of edges.get(name) ?? []) visit(next);
    stack.pop();
    state.set(name, "done");
  }
  for (const workspace of workspaces) visit(workspace.name);
  return [...found].sort().map((cycle) => ({
    code: "workspace-cycle",
    file: "pnpm-workspace.yaml",
    specifier: cycle,
    message: `순환 workspace dependency: ${cycle}`,
  }));
}

export function checkWorkspaceBoundaries(root, manifest) {
  const absoluteRoot = path.resolve(root);
  const workspaces = discoverWorkspaces(absoluteRoot);
  const findings = [];
  const appByWorkspace = new Map(
    ["web", "admin"].map((appName) => [manifest.apps?.[appName]?.workspace, appName]),
  );

  for (const workspace of workspaces) {
    const ownApp = appByWorkspace.get(workspace.name) ?? null;
    const dependencies = declaredDependencies(workspace);
    const aliases = loadAliases(absoluteRoot, workspace);

    for (const field of DEPENDENCY_FIELDS) {
      for (const [name, version] of Object.entries(workspace.manifest[field] ?? {})) {
        if (typeof version === "string" && version.startsWith("file:")) {
          findings.push({
            code: "file-workspace-dependency",
            file: `${workspace.relative}/package.json`,
            specifier: name,
            message: "file: dependency는 workspace 경계를 우회할 수 없습니다.",
          });
        }
      }
    }

    walk(workspace.root, (file) => {
      if (!SOURCE_EXTENSIONS.has(path.extname(file))) return;
      const relativeFile = posix(path.relative(absoluteRoot, file));
      const source = fs.readFileSync(file, "utf8");
      for (const specifier of importSpecifiers(source)) {
        let targetWorkspace = null;
        let viaAlias = false;
        if (specifier.startsWith(".")) {
          targetWorkspace = workspaceForPath(path.resolve(path.dirname(file), specifier), workspaces);
        } else {
          const aliasTarget = resolveAlias(specifier, aliases);
          if (aliasTarget) {
            viaAlias = true;
            targetWorkspace = workspaceForPath(aliasTarget, workspaces);
          } else {
            targetWorkspace = workspaceForSpecifier(specifier, workspaces);
          }
        }
        if (!targetWorkspace || targetWorkspace.name === workspace.name) continue;
        const targetApp = appByWorkspace.get(targetWorkspace.name) ?? null;
        if (ownApp && targetApp) {
          findings.push({ code: "app-to-app", file: relativeFile, specifier, message: `${ownApp} 앱이 ${targetApp} 앱을 직접 참조합니다.` });
        } else if (!ownApp && targetApp) {
          findings.push({ code: "package-to-app", file: relativeFile, specifier, message: "package가 app source를 참조합니다." });
        }
        if (viaAlias) {
          findings.push({ code: "alias-boundary-bypass", file: relativeFile, specifier, message: "TypeScript alias가 workspace 경계를 우회합니다." });
        }
        if (specifier.startsWith(".")) {
          findings.push({ code: "relative-workspace-import", file: relativeFile, specifier, message: "workspace 경계를 넘는 상대경로 import는 금지됩니다. package Public API를 사용하세요." });
        }
        if (!dependencies.has(targetWorkspace.name)) {
          findings.push({ code: "undeclared-workspace-dependency", file: relativeFile, specifier, message: `${targetWorkspace.name} dependency가 manifest에 없습니다.` });
        }
        if (!specifier.startsWith(".") && !viaAlias) {
          if (specifier.includes("/src/") || specifier.endsWith("/src")) {
            findings.push({ code: "package-deep-import", file: relativeFile, specifier, message: "package src deep import는 금지됩니다." });
          } else if (!isExported(targetWorkspace, specifier)) {
            findings.push({ code: "unexported-package-import", file: relativeFile, specifier, message: "package.json#exports에 공개되지 않은 경로입니다." });
          }
        }
      }

      if (ownApp) {
        for (const [otherApp, config] of Object.entries(manifest.apps ?? {})) {
          if (otherApp === ownApp) continue;
          for (const envField of ["baseUrlEnv", "internalBaseUrlEnv"]) {
            if (typeof config?.[envField] !== "string") continue;
            if (new RegExp(`\\b${config[envField]}\\b`).test(source)) {
              findings.push({ code: "app-runtime-url-reference", file: relativeFile, specifier: config[envField], message: `${ownApp} 앱이 ${otherApp} 앱 URL 환경변수를 참조합니다.` });
            }
          }
          const literalUrl = new RegExp(`https?://(?:[^/]*\\.)?${otherApp}(?=[:/'"\\s])`, "i");
          if (literalUrl.test(source)) {
            findings.push({ code: "app-runtime-url-reference", file: relativeFile, specifier: otherApp, message: `${ownApp} 앱이 ${otherApp} 앱 URL을 직접 참조합니다.` });
          }
        }
      }
    });
  }

  findings.push(...cycleFindings(workspaces));
  findings.sort((left, right) =>
    `${left.code}:${left.file}:${left.specifier}`.localeCompare(`${right.code}:${right.file}:${right.specifier}`),
  );
  return { ...validationResult(findings), workspaces: workspaces.map(({ name, relative }) => ({ name, relative })), findings };
}
