const commerceUrl = process.env.COMMERCE_API_URL ?? "http://127.0.0.1:4100";
const analyticsUrl = process.env.ANALYTICS_SINK_URL ?? "http://127.0.0.1:4101";
const commerceToken = process.env.COMMERCE_API_TOKEN ?? "local-commerce-token";
const analyticsToken = process.env.ANALYTICS_WRITE_TOKEN ?? "local-analytics-token";
const mentorAdminToken =
  process.env.MENTOR_SERVICE_ADMIN_TOKEN ?? "local-mentor-admin-token";
const barrierArrivalToken =
  process.env.DLC_BARRIER_ARRIVAL_TOKEN ?? "local-barrier-arrival-token";

const requestJson = async (url, options = {}) => {
  const response = await fetch(url, options);
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(`${options.method ?? "GET"} ${url} -> ${response.status}: ${JSON.stringify(body)}`);
  }
  return { status: response.status, body };
};

const bearer = (token) => ({ authorization: `Bearer ${token}` });
const json = (token, body) => ({
  method: "POST",
  headers: { ...bearer(token), "content-type": "application/json" },
  body: JSON.stringify(body),
});

const results = {};

results.commerceReady = await requestJson(`${commerceUrl}/ready`);
results.commerceVersion = await requestJson(`${commerceUrl}/version`);
results.commerceReset = await requestJson(`${commerceUrl}/__grader/reset`, {
  method: "POST",
  headers: bearer(mentorAdminToken),
});
results.orders = await requestJson(`${commerceUrl}/orders`, {
  headers: bearer(commerceToken),
});

const pending = results.orders.body.orders.find((order) => order.status === "pending");
if (!pending) throw new Error("deterministic seed is missing a pending order");
results.statusMutation = await requestJson(`${commerceUrl}/orders/${pending.id}/status`, {
  method: "PATCH",
  headers: { ...bearer(commerceToken), "content-type": "application/json" },
  body: JSON.stringify({ status: "paid" }),
});

const smokeBarrierId = "mentor-smoke-barrier";
results.barrierPrepare = await requestJson(`${commerceUrl}/__grader/barriers/${smokeBarrierId}/prepare`, {
  method: "POST",
  headers: { ...bearer(mentorAdminToken), "content-type": "application/json" },
  body: JSON.stringify({ expected: 2 }),
});
const arrive = (requestId) => requestJson(`${commerceUrl}/__grader/barriers/${smokeBarrierId}/arrive`, {
  method: "POST",
  headers: { ...bearer(barrierArrivalToken), "content-type": "application/json" },
  body: JSON.stringify({ requestId }),
});
results.barrierArrivals = await Promise.all([arrive("smoke-a"), arrive("smoke-b")]);
results.barrierEvidence = await requestJson(`${commerceUrl}/__grader/barriers/${smokeBarrierId}`, {
  headers: bearer(mentorAdminToken),
});
if (
  results.barrierEvidence.body.released !== true ||
  [...results.barrierEvidence.body.arrivals].sort().join(",") !== "smoke-a,smoke-b"
) {
  throw new Error("mentor barrier did not record two distinct arrivals");
}

results.analyticsReady = await requestJson(`${analyticsUrl}/ready`);
results.analyticsReset = await requestJson(`${analyticsUrl}/__grader/reset`, {
  method: "POST",
  headers: bearer(mentorAdminToken),
});
await requestJson(`${analyticsUrl}/identify`, json(analyticsToken, {
  contextId: "browser-a",
  userId: "customer-a",
  app: "web",
  role: "customer",
}));
await requestJson(`${analyticsUrl}/identify`, json(analyticsToken, {
  contextId: "browser-b",
  userId: "customer-b",
  app: "web",
  role: "customer",
}));
await requestJson(`${analyticsUrl}/events`, json(analyticsToken, {
  contextId: "browser-a",
  app: "web",
  event: "starter_smoke",
  properties: { sentinel: "A" },
}));
await requestJson(`${analyticsUrl}/events`, json(analyticsToken, {
  contextId: "browser-b",
  app: "web",
  event: "starter_smoke",
  properties: { sentinel: "B" },
}));
results.analyticsEvents = await requestJson(`${analyticsUrl}/__grader/events`, {
  headers: bearer(mentorAdminToken),
});

const [eventA, eventB] = results.analyticsEvents.body.events;
if (
  eventA?.identity?.userId !== "customer-a" ||
  eventB?.identity?.userId !== "customer-b"
) {
  throw new Error("analytics identities crossed browser contexts");
}

console.log(JSON.stringify({ ok: true, results }, null, 2));
