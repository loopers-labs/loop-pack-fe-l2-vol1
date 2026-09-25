import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { checkWorkspaceBoundaries } from "./workspace-boundaries.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const fixtures = path.resolve(here, "../../fixtures/boundaries");

function run(name) {
  const root = path.join(fixtures, name);
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "dlc.manifest.json"), "utf8"));
  return checkWorkspaceBoundaries(root, manifest);
}

test("good fixture permits declared public and type-only package imports", () => {
  const result = run("good");
  assert.equal(result.ok, true, JSON.stringify(result.findings, null, 2));
  assert.deepEqual(result.workspaces.map(({ name }) => name), [
    "@fixture/admin",
    "@fixture/format",
    "@fixture/web",
  ]);
});

test("bad fixture deterministically exposes every protected boundary class", () => {
  const result = run("bad");
  assert.equal(result.ok, false);
  const codes = new Set(result.findings.map(({ code }) => code));
  for (const code of [
    "app-to-app",
    "package-to-app",
    "alias-boundary-bypass",
    "undeclared-workspace-dependency",
    "package-deep-import",
    "unexported-package-import",
    "file-workspace-dependency",
    "workspace-cycle",
    "app-runtime-url-reference",
    "relative-workspace-import",
  ]) {
    assert.ok(codes.has(code), `missing ${code}: ${JSON.stringify(result.findings, null, 2)}`);
  }
});
