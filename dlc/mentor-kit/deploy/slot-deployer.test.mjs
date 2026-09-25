import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { deploySlot, rollbackSlot } from "./slot-deployer.mjs";

const digest = (value) => `registry.local/app@sha256:${value.repeat(64)}`;

test("switches only after readiness and records the previous digest", async () => {
  const directory = await mkdtemp(join(tmpdir(), "dlc-deploy-"));
  const stateFile = join(directory, "state.json");
  const calls = [];

  const first = await deploySlot({
    app: "web",
    digest: digest("a"),
    slot: "blue",
    readinessUrl: "http://web-blue/ready",
    stateFile,
    startSlot: async (input) => calls.push(["start", input]),
    stopSlot: async (input) => calls.push(["stop", input]),
    switchTraffic: async (input) => calls.push(["switch", input]),
    fetchImpl: async () => ({ ok: true, status: 200 }),
    now: () => "2026-09-25T00:00:00.000Z",
  });
  assert.equal(first.ok, true);

  let attempts = 0;
  const second = await deploySlot({
    app: "web",
    digest: digest("b"),
    slot: "green",
    readinessUrl: "http://web-green/ready",
    stateFile,
    startSlot: async (input) => calls.push(["start", input]),
    stopSlot: async (input) => calls.push(["stop", input]),
    switchTraffic: async (input) => calls.push(["switch", input]),
    fetchImpl: async () => {
      attempts += 1;
      return { ok: attempts > 1, status: attempts > 1 ? 200 : 503 };
    },
    attempts: 2,
    intervalMs: 0,
    sleep: async () => undefined,
    now: () => "2026-09-25T00:01:00.000Z",
  });

  assert.equal(second.ok, true);
  assert.equal(second.previous.digest, digest("a"));
  assert.deepEqual(calls.at(-1), ["switch", { app: "web", slot: "green" }]);
  const state = JSON.parse(await readFile(stateFile, "utf8"));
  assert.equal(state.apps.web.current.digest, digest("b"));
  assert.equal(state.apps.web.previous.digest, digest("a"));
});

test("does not switch traffic when readiness fails", async () => {
  const directory = await mkdtemp(join(tmpdir(), "dlc-deploy-"));
  const calls = [];
  const result = await deploySlot({
    app: "admin",
    digest: digest("c"),
    slot: "green",
    readinessUrl: "http://admin-green/ready",
    stateFile: join(directory, "state.json"),
    startSlot: async (input) => calls.push(["start", input]),
    stopSlot: async (input) => calls.push(["stop", input]),
    switchTraffic: async (input) => calls.push(["switch", input]),
    fetchImpl: async () => ({ ok: false, status: 503 }),
    attempts: 2,
    intervalMs: 0,
    sleep: async () => undefined,
  });

  assert.equal(result.ok, false);
  assert.equal(calls.some(([name]) => name === "switch"), false);
  assert.deepEqual(calls.at(-1), ["stop", { app: "admin", slot: "green" }]);
});

test("rollback switches to the recorded previous slot", async () => {
  const directory = await mkdtemp(join(tmpdir(), "dlc-deploy-"));
  const stateFile = join(directory, "state.json");
  const noop = async () => undefined;
  await deploySlot({
    app: "web",
    digest: digest("a"),
    slot: "blue",
    readinessUrl: "http://web-blue/ready",
    stateFile,
    startSlot: noop,
    stopSlot: noop,
    switchTraffic: noop,
    fetchImpl: async () => ({ ok: true, status: 200 }),
  });
  await deploySlot({
    app: "web",
    digest: digest("b"),
    slot: "green",
    readinessUrl: "http://web-green/ready",
    stateFile,
    startSlot: noop,
    stopSlot: noop,
    switchTraffic: noop,
    fetchImpl: async () => ({ ok: true, status: 200 }),
  });

  const calls = [];
  const result = await rollbackSlot({
    app: "web",
    stateFile,
    switchTraffic: async (input) => calls.push(["switch", input]),
    stopSlot: async (input) => calls.push(["stop", input]),
  });
  assert.equal(result.current.digest, digest("a"));
  assert.deepEqual(calls, [
    ["switch", { app: "web", slot: "blue" }],
    ["stop", { app: "web", slot: "green" }],
  ]);
});

test("state persistence failure after cutover switches back before stopping", async () => {
  const directory = await mkdtemp(join(tmpdir(), "dlc-deploy-"));
  const stateFile = join(directory, "state.json");
  const noop = async () => undefined;
  await deploySlot({
    app: "web",
    digest: digest("a"),
    slot: "blue",
    readinessUrl: "http://web-blue/ready",
    stateFile,
    startSlot: noop,
    stopSlot: noop,
    switchTraffic: noop,
    fetchImpl: async () => ({ ok: true, status: 200 }),
  });

  const calls = [];
  const result = await deploySlot({
    app: "web",
    digest: digest("b"),
    slot: "green",
    readinessUrl: "http://web-green/ready",
    stateFile,
    startSlot: async () => undefined,
    stopSlot: async (input) => calls.push(["stop", input]),
    switchTraffic: async (input) => calls.push(["switch", input]),
    fetchImpl: async () => ({ ok: true, status: 200 }),
    persistState: async () => {
      throw new Error("disk full");
    },
  });

  assert.equal(result.ok, false);
  assert.equal(result.recoveryError, null);
  assert.deepEqual(calls, [
    ["switch", { app: "web", slot: "green" }],
    ["switch", { app: "web", slot: "blue" }],
    ["stop", { app: "web", slot: "green" }],
  ]);
});
