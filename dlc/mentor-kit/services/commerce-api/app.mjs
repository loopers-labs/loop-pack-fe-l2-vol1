import { createServer } from "node:http";

export const COMMERCE_API_VERSION = "1.0.0";
export const SEED_VERSION = "commerce-seed-v1";

const allowedStatuses = new Set([
  "pending",
  "paid",
  "preparing",
  "shipped",
  "cancelled",
]);

const allowedTransitions = new Map([
  ["pending", new Set(["paid", "cancelled"])],
  ["paid", new Set(["preparing", "cancelled"])],
  ["preparing", new Set(["shipped"])],
  ["shipped", new Set()],
  ["cancelled", new Set()],
]);

const seedOrders = () => [
  {
    id: "order-customer-a-001",
    customerId: "customer-a",
    customerEmail: "customer-a@loopers.test",
    status: "paid",
    createdAt: "2026-09-01T09:00:00.000Z",
    items: [{ productId: "p1", quantity: 1, unitPrice: 79_000 }],
  },
  {
    id: "order-customer-a-002",
    customerId: "customer-a",
    customerEmail: "customer-a@loopers.test",
    status: "pending",
    createdAt: "2026-09-02T09:00:00.000Z",
    items: [{ productId: "p2", quantity: 2, unitPrice: 39_000 }],
  },
  {
    id: "order-customer-b-001",
    customerId: "customer-b",
    customerEmail: "customer-b@loopers.test",
    status: "preparing",
    createdAt: "2026-09-03T09:00:00.000Z",
    items: [{ productId: "p16", quantity: 1, unitPrice: 75_000 }],
  },
];

const clone = (value) => structuredClone(value);

const writeJson = (response, status, body, headers = {}) => {
  const payload = JSON.stringify(body);
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(payload),
    "cache-control": "no-store",
    ...headers,
  });
  response.end(payload);
};

const readJson = async (request, maxBytes = 32 * 1024) => {
  const chunks = [];
  let size = 0;

  for await (const chunk of request) {
    size += chunk.length;
    if (size > maxBytes) {
      const error = new Error("request body is too large");
      error.statusCode = 413;
      throw error;
    }
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    const error = new Error("request body must be valid JSON");
    error.statusCode = 400;
    throw error;
  }
};

const bearerMatches = (request, expected) =>
  request.headers.authorization === `Bearer ${expected}`;

export function createCommerceApi({
  internalToken,
  graderToken,
  barrierArrivalToken,
  barrierTimeoutMs = 10_000,
  serviceVersion = process.env.SERVICE_VERSION || COMMERCE_API_VERSION,
} = {}) {
  if (!internalToken || !graderToken || !barrierArrivalToken) {
    throw new Error("internalToken, graderToken, and barrierArrivalToken are required");
  }

  let orders = seedOrders();
  const barriers = new Map();

  const clearBarriers = () => {
    for (const barrier of barriers.values()) {
      clearTimeout(barrier.timeout);
      barrier.release();
    }
    barriers.clear();
  };

  const reset = () => {
    orders = seedOrders();
    clearBarriers();
    return {
      seedVersion: SEED_VERSION,
      orderCount: orders.length,
      customerIds: ["customer-a", "customer-b"],
    };
  };

  const handler = async (request, response) => {
    const url = new URL(request.url ?? "/", "http://commerce-api.internal");

    if (request.method === "GET" && url.pathname === "/health") {
      return writeJson(response, 200, { status: "ok" });
    }

    if (request.method === "GET" && url.pathname === "/ready") {
      return writeJson(response, 200, {
        ready: true,
        service: "commerce-api",
        seedVersion: SEED_VERSION,
      });
    }

    if (request.method === "GET" && url.pathname === "/version") {
      return writeJson(response, 200, {
        service: "commerce-api",
        version: serviceVersion,
        contractVersion: 1,
        seedVersion: SEED_VERSION,
      });
    }

    if (url.pathname === "/__grader/reset") {
      if (request.method !== "POST") {
        return writeJson(response, 405, { error: "method_not_allowed" }, { allow: "POST" });
      }
      if (!bearerMatches(request, graderToken)) {
        return writeJson(response, 403, { error: "grader_token_required" });
      }
      return writeJson(response, 200, reset());
    }

    const prepareBarrier = url.pathname.match(/^\/__grader\/barriers\/([^/]+)\/prepare$/);
    if (prepareBarrier) {
      if (request.method !== "POST") {
        return writeJson(response, 405, { error: "method_not_allowed" }, { allow: "POST" });
      }
      if (!bearerMatches(request, graderToken)) {
        return writeJson(response, 403, { error: "grader_token_required" });
      }
      if (barriers.size >= 100) {
        return writeJson(response, 429, { error: "barrier_limit_reached" });
      }
      const barrierId = decodeURIComponent(prepareBarrier[1]);
      const body = await readJson(request);
      if (body.expected !== 2 || barriers.has(barrierId)) {
        return writeJson(response, 409, { error: "invalid_or_duplicate_barrier" });
      }
      let release;
      const released = new Promise((resolve) => { release = resolve; });
      const barrier = {
        expected: 2,
        arrivals: new Set(),
        released: false,
        timedOut: false,
        promise: released,
        release,
        timeout: null,
      };
      barrier.timeout = setTimeout(() => {
        barrier.timedOut = true;
        barrier.release();
      }, barrierTimeoutMs);
      barriers.set(barrierId, barrier);
      return writeJson(response, 201, { barrierId, expected: 2 });
    }

    const barrierPath = url.pathname.match(/^\/__grader\/barriers\/([^/]+)$/);
    if (barrierPath && request.method === "GET") {
      if (!bearerMatches(request, graderToken)) {
        return writeJson(response, 403, { error: "grader_token_required" });
      }
      const barrierId = decodeURIComponent(barrierPath[1]);
      const barrier = barriers.get(barrierId);
      if (!barrier) return writeJson(response, 404, { error: "barrier_not_found" });
      return writeJson(response, 200, {
        barrierId,
        expected: barrier.expected,
        arrivals: [...barrier.arrivals],
        released: barrier.released,
        timedOut: barrier.timedOut,
      });
    }

    const arriveBarrier = url.pathname.match(/^\/__grader\/barriers\/([^/]+)\/arrive$/);
    if (arriveBarrier) {
      if (request.method !== "POST") {
        return writeJson(response, 405, { error: "method_not_allowed" }, { allow: "POST" });
      }
      if (!bearerMatches(request, barrierArrivalToken)) {
        return writeJson(response, 403, { error: "barrier_arrival_token_required" });
      }
      const barrierId = decodeURIComponent(arriveBarrier[1]);
      const barrier = barriers.get(barrierId);
      if (!barrier) return writeJson(response, 404, { error: "barrier_not_found" });
      const body = await readJson(request);
      if (typeof body.requestId !== "string" || body.requestId.length === 0 || body.requestId.length > 200) {
        return writeJson(response, 400, { error: "invalid_request_id" });
      }
      if (barrier.arrivals.has(body.requestId)) {
        return writeJson(response, 409, { error: "duplicate_arrival" });
      }
      barrier.arrivals.add(body.requestId);
      if (barrier.arrivals.size >= barrier.expected) {
        barrier.released = true;
        clearTimeout(barrier.timeout);
        barrier.release();
      }
      await barrier.promise;
      if (barrier.timedOut) {
        return writeJson(response, 504, { error: "barrier_timeout", barrierId });
      }
      return writeJson(response, 200, {
        barrierId,
        requestId: body.requestId,
        arrivals: barrier.arrivals.size,
        released: true,
      });
    }

    if (url.pathname === "/orders" && request.method === "GET") {
      if (!bearerMatches(request, internalToken)) {
        return writeJson(response, 401, { error: "internal_token_required" });
      }

      const customerId = url.searchParams.get("customerId");
      const selected = customerId
        ? orders.filter((order) => order.customerId === customerId)
        : orders;
      return writeJson(response, 200, { orders: clone(selected) });
    }

    const orderMatch = url.pathname.match(/^\/orders\/([^/]+)$/);
    if (orderMatch && request.method === "GET") {
      if (!bearerMatches(request, internalToken)) {
        return writeJson(response, 401, { error: "internal_token_required" });
      }
      const order = orders.find(({ id }) => id === decodeURIComponent(orderMatch[1]));
      return order
        ? writeJson(response, 200, { order: clone(order) })
        : writeJson(response, 404, { error: "order_not_found" });
    }

    const statusMatch = url.pathname.match(/^\/orders\/([^/]+)\/status$/);
    if (statusMatch && request.method === "PATCH") {
      if (!bearerMatches(request, internalToken)) {
        return writeJson(response, 401, { error: "internal_token_required" });
      }

      const order = orders.find(({ id }) => id === decodeURIComponent(statusMatch[1]));
      if (!order) {
        return writeJson(response, 404, { error: "order_not_found" });
      }

      const body = await readJson(request);
      if (!body || typeof body !== "object" || !allowedStatuses.has(body.status)) {
        return writeJson(response, 400, {
          error: "invalid_status",
          allowedStatuses: [...allowedStatuses],
        });
      }

      if (!allowedTransitions.get(order.status)?.has(body.status)) {
        return writeJson(response, 409, {
          error: "invalid_status_transition",
          from: order.status,
          to: body.status,
          allowedNext: [...(allowedTransitions.get(order.status) ?? [])],
        });
      }

      order.status = body.status;
      return writeJson(response, 200, { order: clone(order) });
    }

    return writeJson(response, 404, { error: "not_found" });
  };

  const server = createServer((request, response) => {
    handler(request, response).catch((error) => {
      const status = Number.isInteger(error.statusCode) ? error.statusCode : 500;
      writeJson(response, status, {
        error: status === 500 ? "internal_error" : "invalid_request",
        message: status === 500 ? "unexpected server error" : error.message,
      });
    });
  });

  return { server, reset };
}
