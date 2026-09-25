import assert from "node:assert/strict";
import test from "node:test";
import { once } from "node:events";
import { checkAnalyticsRecords } from "../grader/runtime-contract.mjs";
import { createAnalyticsSink } from "../services/analytics-sink/app.mjs";

const WRITER = "writer-token";
const GRADER = "mentor-admin-token";

const start = async (options = {}) => {
  const { server } = createAnalyticsSink({
    writeToken: WRITER,
    graderToken: GRADER,
    now: () => "2026-09-25T00:00:00.000Z",
    ...options,
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: () => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())),
  };
};

const post = (baseUrl, path, body) =>
  fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { authorization: `Bearer ${WRITER}`, "content-type": "application/json" },
    body: JSON.stringify(body),
  });

test("real analytics sink records satisfy the runtime lifecycle grader", async (t) => {
  const app = await start();
  t.after(app.close);
  await post(app.baseUrl, "/identify", { contextId: "a", userId: "customer-a", app: "web", role: "customer" });
  await post(app.baseUrl, "/events", { contextId: "a", app: "web", event: "view" });
  await post(app.baseUrl, "/identity/reset", { contextId: "a" });
  await post(app.baseUrl, "/events", { contextId: "a", app: "web", event: "signed_out" });

  const response = await fetch(`${app.baseUrl}/__grader/records`, {
    headers: { authorization: `Bearer ${GRADER}` },
  });
  const { records } = await response.json();
  assert.equal(checkAnalyticsRecords(records, { a: records }).ok, true);
  assert.deepEqual(records.map(({ type, identity }) => ({ type, identity })), [
    { type: "identify", identity: "customer-a" },
    { type: "track", identity: "customer-a" },
    { type: "reset", identity: null },
    { type: "track", identity: null },
  ]);
});

test("sink bounds untrusted browser contexts and events", async (t) => {
  const app = await start({ maxContexts: 1, maxEvents: 1, maxRecords: 10 });
  t.after(app.close);
  assert.equal((await post(app.baseUrl, "/identify", { contextId: "a", userId: "a", app: "web", role: "customer" })).status, 200);
  assert.equal((await post(app.baseUrl, "/identify", { contextId: "b", userId: "b", app: "web", role: "customer" })).status, 429);
  assert.equal((await post(app.baseUrl, "/events", { contextId: "a", app: "web", event: "first" })).status, 202);
  assert.equal((await post(app.baseUrl, "/events", { contextId: "a", app: "web", event: "second" })).status, 429);
});
