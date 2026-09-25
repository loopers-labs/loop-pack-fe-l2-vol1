import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createCommerceApi, SEED_VERSION } from "./app.mjs";

const INTERNAL_TOKEN = "commerce-test-token";
const GRADER_TOKEN = "grader-test-token";
const BARRIER_ARRIVAL_TOKEN = "barrier-arrival-test-token";

let baseUrl;
let api;

before(async () => {
  api = createCommerceApi({
    internalToken: INTERNAL_TOKEN,
    graderToken: GRADER_TOKEN,
    barrierArrivalToken: BARRIER_ARRIVAL_TOKEN,
    serviceVersion: "test-version",
  });
  await new Promise((resolve) => api.server.listen(0, "127.0.0.1", resolve));
  const address = api.server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await new Promise((resolve, reject) =>
    api.server.close((error) => (error ? reject(error) : resolve())),
  );
});

const json = async (path, init) => {
  const response = await fetch(`${baseUrl}${path}`, init);
  return { response, body: await response.json() };
};

const internal = (init = {}) => ({
  ...init,
  headers: {
    authorization: `Bearer ${INTERNAL_TOKEN}`,
    "content-type": "application/json",
    ...init.headers,
  },
});

test("health, readiness and version are stable", async () => {
  assert.deepEqual((await json("/health")).body, { status: "ok" });
  assert.deepEqual((await json("/ready")).body, {
    ready: true,
    service: "commerce-api",
    seedVersion: SEED_VERSION,
  });
  assert.deepEqual((await json("/version")).body, {
    service: "commerce-api",
    version: "test-version",
    contractVersion: 1,
    seedVersion: SEED_VERSION,
  });
});

test("order APIs require the internal token and filter deterministic customers", async () => {
  assert.equal((await json("/orders")).response.status, 401);

  const { response, body } = await json(
    "/orders?customerId=customer-a",
    internal(),
  );
  assert.equal(response.status, 200);
  assert.deepEqual(
    body.orders.map(({ id }) => id),
    ["order-customer-a-001", "order-customer-a-002"],
  );
  assert.ok(body.orders.every(({ customerId }) => customerId === "customer-a"));
});

test("status mutation validates transitions", async () => {
  const changed = await json(
    "/orders/order-customer-a-001/status",
    internal({ method: "PATCH", body: JSON.stringify({ status: "preparing" }) }),
  );
  assert.equal(changed.response.status, 200);
  assert.equal(changed.body.order.status, "preparing");

  const invalid = await json(
    "/orders/order-customer-a-001/status",
    internal({ method: "PATCH", body: JSON.stringify({ status: "paid" }) }),
  );
  assert.equal(invalid.response.status, 409);
  assert.equal(invalid.body.error, "invalid_status_transition");
});

test("grader reset is protected and restores the exact seed", async () => {
  assert.equal(
    (await json("/__grader/reset", { method: "POST" })).response.status,
    403,
  );

  const reset = await json("/__grader/reset", {
    method: "POST",
    headers: { authorization: `Bearer ${GRADER_TOKEN}` },
  });
  assert.equal(reset.response.status, 200);
  assert.deepEqual(reset.body, {
    seedVersion: SEED_VERSION,
    orderCount: 3,
    customerIds: ["customer-a", "customer-b"],
  });

  const restored = await json(
    "/orders/order-customer-a-001",
    internal(),
  );
  assert.equal(restored.body.order.status, "paid");
});

test("mentor-controlled barrier proves two distinct request arrivals", async () => {
  const barrierId = "same-instance-proof";
  const prepared = await json(`/__grader/barriers/${barrierId}/prepare`, {
    method: "POST",
    headers: { authorization: `Bearer ${GRADER_TOKEN}`, "content-type": "application/json" },
    body: JSON.stringify({ expected: 2 }),
  });
  assert.equal(prepared.response.status, 201);

  const arrive = (requestId) => json(`/__grader/barriers/${barrierId}/arrive`, {
    method: "POST",
    headers: { authorization: `Bearer ${BARRIER_ARRIVAL_TOKEN}`, "content-type": "application/json" },
    body: JSON.stringify({ requestId }),
  });
  const [first, second] = await Promise.all([arrive("request-a"), arrive("request-b")]);
  assert.equal(first.response.status, 200);
  assert.equal(second.response.status, 200);

  const evidence = await json(`/__grader/barriers/${barrierId}`, {
    headers: { authorization: `Bearer ${GRADER_TOKEN}` },
  });
  assert.deepEqual(evidence.body, {
    barrierId,
    expected: 2,
    arrivals: ["request-a", "request-b"],
    released: true,
    timedOut: false,
  });
});
