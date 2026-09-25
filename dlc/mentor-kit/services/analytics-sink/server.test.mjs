import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createAnalyticsSink } from "./app.mjs";

const WRITE_TOKEN = "analytics-test-token";
const GRADER_TOKEN = "grader-test-token";

let baseUrl;
let sink;

before(async () => {
  sink = createAnalyticsSink({
    writeToken: WRITE_TOKEN,
    graderToken: GRADER_TOKEN,
    serviceVersion: "test-version",
    allowedOrigins: ["https://web.loopers.test", "https://admin.loopers.test"],
    now: () => "2026-09-25T00:00:00.000Z",
  });
  await new Promise((resolve) => sink.server.listen(0, "127.0.0.1", resolve));
  const address = sink.server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await new Promise((resolve, reject) =>
    sink.server.close((error) => (error ? reject(error) : resolve())),
  );
});

const json = async (path, init) => {
  const response = await fetch(`${baseUrl}${path}`, init);
  return { response, body: await response.json() };
};

const authorized = (token, init = {}) => ({
  ...init,
  headers: {
    authorization: `Bearer ${token}`,
    "content-type": "application/json",
    ...init.headers,
  },
});

const post = (path, body, token = WRITE_TOKEN) =>
  json(path, authorized(token, { method: "POST", body: JSON.stringify(body) }));

test("health and version surfaces are available", async () => {
  assert.equal((await json("/health")).response.status, 200);
  assert.deepEqual((await json("/ready")).body, {
    ready: true,
    service: "analytics-sink",
  });
  assert.deepEqual((await json("/version")).body, {
    service: "analytics-sink",
    version: "test-version",
    contractVersion: 1,
  });
});

test("write and grader surfaces use different credentials", async () => {
  assert.equal(
    (await post("/identify", {
      contextId: "context-a",
      userId: "customer-a",
      app: "web",
      role: "customer",
    }, "wrong-token")).response.status,
    401,
  );
  assert.equal((await json("/__grader/events")).response.status, 403);
});

test("browser preflight allows configured origins and rejects others", async () => {
  const allowed = await fetch(`${baseUrl}/events`, {
    method: "OPTIONS",
    headers: { origin: "https://web.loopers.test" },
  });
  assert.equal(allowed.status, 204);
  assert.equal(
    allowed.headers.get("access-control-allow-origin"),
    "https://web.loopers.test",
  );

  const rejected = await json("/events", {
    method: "OPTIONS",
    headers: { origin: "https://attacker.test" },
  });
  assert.equal(rejected.response.status, 403);
});

test("two browser contexts retain independent identities", async () => {
  await post("/identify", {
    contextId: "context-a",
    userId: "customer-a",
    app: "web",
    role: "customer",
  });
  await post("/identify", {
    contextId: "context-b",
    userId: "admin-a",
    app: "admin",
    role: "admin",
  });

  await Promise.all([
    post("/events", {
      contextId: "context-a",
      app: "web",
      event: "product_view",
      properties: { productId: "p1" },
    }),
    post("/events", {
      contextId: "context-b",
      app: "admin",
      event: "order_status_changed",
      properties: { orderId: "order-customer-a-001" },
    }),
  ]);

  const recorded = await json(
    "/__grader/events",
    authorized(GRADER_TOKEN),
  );
  assert.equal(recorded.response.status, 200);
  assert.deepEqual(
    Object.fromEntries(
      recorded.body.events.map((event) => [event.contextId, event.identity.userId]),
    ),
    { "context-a": "customer-a", "context-b": "admin-a" },
  );
});

test("resetting one identity does not reset another context", async () => {
  await post("/identity/reset", { contextId: "context-a" });
  await post("/events", {
    contextId: "context-a",
    app: "web",
    event: "signed_out",
  });
  await post("/events", {
    contextId: "context-b",
    app: "admin",
    event: "orders_viewed",
  });

  const contextA = await json(
    "/__grader/events?contextId=context-a",
    authorized(GRADER_TOKEN),
  );
  const contextB = await json(
    "/__grader/events?contextId=context-b",
    authorized(GRADER_TOKEN),
  );
  assert.equal(contextA.body.events.at(-1).identity, null);
  assert.equal(contextB.body.events.at(-1).identity.userId, "admin-a");
});

test("an identified context cannot emit under a different app", async () => {
  const mismatch = await post("/events", {
    contextId: "context-b",
    app: "web",
    event: "cross_app_attempt",
  });
  assert.equal(mismatch.response.status, 409);
  assert.equal(mismatch.body.error, "identity_app_mismatch");
});

test("grader reset clears events, identities and event sequence", async () => {
  const reset = await json(
    "/__grader/reset",
    authorized(GRADER_TOKEN, { method: "POST" }),
  );
  assert.deepEqual(reset.body, { reset: true });

  const events = await json("/__grader/events", authorized(GRADER_TOKEN));
  const identities = await json(
    "/__grader/identities",
    authorized(GRADER_TOKEN),
  );
  assert.deepEqual(events.body.events, []);
  assert.deepEqual(identities.body.identities, []);

  const accepted = await post("/events", {
    contextId: "anonymous-context",
    app: "web",
    event: "landing_view",
  });
  assert.equal(accepted.body.eventId, "event-0001");
});
