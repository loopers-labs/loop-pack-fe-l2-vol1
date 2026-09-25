import assert from "node:assert/strict";
import test from "node:test";
import { runManifestCommands } from "./command-runner.mjs";

const node = JSON.stringify(process.execPath);

test("manifest commands execute from one declared surface and return structured evidence", async () => {
  const result = await runManifestCommands({
    root: process.cwd(),
    manifest: {
      commands: {
        boundaries: `${node} -e "process.stdout.write('boundary-ok')"`,
        plan: `${node} -e "process.stderr.write('plan-failed'); process.exit(7)"`,
        verify: `${node} -e "process.exit(0)"`,
        runtime: `${node} -e "process.exit(0)"`,
      },
    },
    names: ["boundaries", "plan"],
    timeoutMs: 5_000,
  });

  assert.equal(result.ok, false);
  assert.equal(result.results[0].ok, true);
  assert.equal(result.results[0].stdout, "boundary-ok");
  assert.equal(result.results[1].exitCode, 7);
  assert.equal(result.results[1].stderr, "plan-failed");
});

test("unknown command names fail before executing student code", async () => {
  const result = await runManifestCommands({
    root: process.cwd(),
    manifest: { commands: {} },
    names: ["not-declared"],
  });
  assert.equal(result.ok, false);
  assert.match(result.error, /unknown manifest command/);
  assert.deepEqual(result.results, []);
});
