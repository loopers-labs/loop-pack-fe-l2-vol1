import assert from "node:assert/strict";
import http from "node:http";
import test from "node:test";
import {
  checkAnalyticsRecords,
  checkPublicHookClosure,
  createCanonicalSessionCases,
  runSameInstanceIsolation,
  runSessionMatrix,
} from "./runtime-contract.mjs";

class MemoryBarrier {
  #states = new Map();

  async prepare(id, expected) {
    let release;
    const released = new Promise((resolve) => { release = resolve; });
    this.#states.set(id, { count: 0, expected, released, release, waiters: [], arrivals: new Set() });
  }

  async arrive(id, requestId) {
    if (!this.#states.has(id)) await this.prepare(id, 2);
    const state = this.#states.get(id);
    state.count += 1;
    state.arrivals.add(requestId);
    for (const waiter of state.waiters.splice(0)) waiter();
    if (state.count >= state.expected) state.release();
    await state.released;
  }

  async waitForArrivals(id, count) {
    const state = this.#states.get(id);
    if (!state) throw new Error(`unknown barrier ${id}`);
    while (state.count < count) {
      await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`barrier ${id} timeout`)), 2_000);
        state.waiters.push(() => {
          clearTimeout(timer);
          resolve();
        });
      });
    }
  }

  async release(id) {
    this.#states.get(id)?.release();
  }

  async inspect(id) {
    const state = this.#states.get(id);
    return {
      barrierId: id,
      expected: state.expected,
      arrivals: [...state.arrivals],
      released: state.count >= state.expected,
      timedOut: false,
    };
  }
}

function parseCookies(header = "") {
  return Object.fromEntries(
    header.split(";").map((value) => value.trim()).filter(Boolean).map((value) => {
      const index = value.indexOf("=");
      return [value.slice(0, index), value.slice(index + 1)];
    }),
  );
}

async function startApp(appName, barrier, { openHook = false, publicIngress = false, unsafeMutation = false, skipBarrier = false } = {}) {
  const contract = appName === "web"
    ? { role: "customer", audience: "web", secret: "web-secret", cookie: "web_session" }
    : { role: "admin", audience: "admin", secret: "admin-secret", cookie: "admin_session" };
  const instanceId = `${appName}-instance-1`;
  let processWideViewer = null;
  const server = http.createServer(async (request, response) => {
    const url = new URL(request.url, `http://${request.headers.host}`);
    if (publicIngress && url.pathname.startsWith("/api/__dlc/")) {
      response.statusCode = 404;
      response.end("not found");
      return;
    }
    if (openHook && url.pathname.startsWith("/api/__dlc/")) {
      response.statusCode = 200;
      response.end("open");
      return;
    }
    if (
      url.pathname === "/api/__dlc/session" &&
      request.method === "POST" &&
      request.headers["x-dlc-grader-token"] === "test-token"
    ) {
      const chunks = [];
      for await (const chunk of request) chunks.push(chunk);
      const { account, signingApp, audience = signingApp } = JSON.parse(Buffer.concat(chunks).toString("utf8"));
      const role = account.startsWith("admin-") ? "admin" : "customer";
      response.statusCode = 201;
      response.setHeader("set-cookie", `${contract.cookie}=${account}|${role}|${audience}|${contract.secret}; HttpOnly; Path=/; SameSite=Lax`);
      response.end();
      return;
    }
    if (url.pathname.startsWith("/api/__dlc/")) {
      response.statusCode = openHook ? 200 : 404;
      response.end(openHook ? "open" : "not found");
      return;
    }
    if (url.pathname !== "/api/me") {
      response.statusCode = 404;
      response.end("not found");
      return;
    }
    const token = parseCookies(request.headers.cookie)[contract.cookie];
    const [id, role, audience, secret] = token?.split("|") ?? [];
    if (role !== contract.role || audience !== contract.audience || secret !== contract.secret) {
      response.statusCode = token ? 403 : 401;
      response.setHeader("content-type", "application/json");
      response.end(JSON.stringify({ error: "unauthorized" }));
      return;
    }
    const requestViewer = { id: `dlc-${id}`, alias: id, name: id, role, audience };
    if (unsafeMutation) processWideViewer = requestViewer;
    if (!skipBarrier && request.headers["x-dlc-grader-token"] === "test-token" && request.headers["x-dlc-barrier-id"]) {
      await barrier.arrive(request.headers["x-dlc-barrier-id"], request.headers["x-dlc-request-id"]);
    }
    response.statusCode = 200;
    response.setHeader("content-type", "application/json");
    response.setHeader("x-dlc-instance-id", instanceId);
    response.setHeader("x-dlc-request-id", request.headers["x-dlc-request-id"] ?? "missing");
    if (request.headers["x-dlc-barrier-id"]) {
      response.setHeader("x-dlc-barrier-id", request.headers["x-dlc-barrier-id"]);
    }
    response.end(JSON.stringify({ viewer: unsafeMutation ? processWideViewer : requestViewer }));
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  return {
    app: { baseUrl: `http://127.0.0.1:${address.port}`, viewerPath: "/api/me" },
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

test("role, audience, signing key, and renamed cross-app cookie replay are independently rejected", async (t) => {
  const barrier = new MemoryBarrier();
  const web = await startApp("web", barrier);
  const admin = await startApp("admin", barrier);
  t.after(async () => { await web.close(); await admin.close(); });
  const apps = { web: web.app, admin: admin.app };
  const cases = await createCanonicalSessionCases({
    apps,
    accounts: { customerA: "customer-a", customerB: "customer-b", adminA: "admin-a", adminB: "admin-b" },
    contracts: { sessionFixturePath: "/api/__dlc/session", graderTokenHeader: "x-dlc-grader-token" },
    graderToken: "test-token",
  });
  const result = await runSessionMatrix({ apps, cases });
  assert.equal(result.ok, true, JSON.stringify(result.errors, null, 2));
});

test("barrier forces two viewers through one instance without identity crossover", async (t) => {
  const barrier = new MemoryBarrier();
  const web = await startApp("web", barrier);
  t.after(web.close);
  const result = await runSameInstanceIsolation({
    app: web.app,
    actors: [
      { cookie: "web_session=customer-a|customer|web|web-secret", expectedBody: { viewer: { id: "dlc-customer-a", role: "customer" } } },
      { cookie: "web_session=customer-b|customer|web|web-secret", expectedBody: { viewer: { id: "dlc-customer-b", role: "customer" } } },
    ],
    barrierId: "deterministic-race",
    headers: {
      requestHeader: "x-dlc-request-id",
      instanceHeader: "x-dlc-instance-id",
      barrierHeader: "x-dlc-barrier-id",
      graderTokenHeader: "x-dlc-grader-token",
      graderToken: "test-token",
    },
    barrierControl: barrier,
  });
  assert.equal(result.ok, true, JSON.stringify(result.errors, null, 2));
});

test("barrier makes a process-wide current viewer mutation fail deterministically", async (t) => {
  const barrier = new MemoryBarrier();
  const web = await startApp("web", barrier, { unsafeMutation: true });
  t.after(web.close);
  const result = await runSameInstanceIsolation({
    app: web.app,
    actors: [
      { cookie: "web_session=customer-a|customer|web|web-secret", expectedBody: { viewer: { id: "dlc-customer-a" } } },
      { cookie: "web_session=customer-b|customer|web|web-secret", expectedBody: { viewer: { id: "dlc-customer-b" } } },
    ],
    barrierId: "unsafe-race",
    headers: {
      requestHeader: "x-dlc-request-id",
      instanceHeader: "x-dlc-instance-id",
      barrierHeader: "x-dlc-barrier-id",
      graderTokenHeader: "x-dlc-grader-token",
      graderToken: "test-token",
    },
    barrierControl: barrier,
  });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some(({ code }) => code === "viewer-leak"));
});

test("echoing a barrier header without mentor arrival evidence fails", async (t) => {
  const barrier = new MemoryBarrier();
  const web = await startApp("web", barrier, { skipBarrier: true });
  t.after(web.close);
  const result = await runSameInstanceIsolation({
    app: web.app,
    actors: [
      { cookie: "web_session=customer-a|customer|web|web-secret", expectedBody: { viewer: { id: "dlc-customer-a" } } },
      { cookie: "web_session=customer-b|customer|web|web-secret", expectedBody: { viewer: { id: "dlc-customer-b" } } },
    ],
    barrierId: "fake-echo",
    headers: {
      requestHeader: "x-dlc-request-id",
      instanceHeader: "x-dlc-instance-id",
      barrierHeader: "x-dlc-barrier-id",
      graderTokenHeader: "x-dlc-grader-token",
      graderToken: "test-token",
    },
    barrierControl: barrier,
  });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some(({ code }) => code === "barrier-evidence"));
});

test("analytics records preserve context-local identify/reset lifecycle", () => {
  const records = [
    { contextId: "browser-a", type: "identify", identity: "customer-a" },
    { contextId: "browser-b", type: "identify", identity: "customer-b" },
    { contextId: "browser-a", type: "track", event: "view", identity: "customer-a" },
    { contextId: "browser-a", type: "reset", identity: null },
    { contextId: "browser-b", type: "track", event: "view", identity: "customer-b" },
    { contextId: "browser-a", type: "track", event: "anonymous", identity: null },
  ];
  const expected = {
    "browser-a": [records[0], records[2], records[3], records[5]],
    "browser-b": [records[1], records[4]],
  };
  assert.equal(checkAnalyticsRecords(records, expected).ok, true);

  const leaked = records.map((record) => ({ ...record }));
  leaked[2].identity = "customer-b";
  const failure = checkAnalyticsRecords(leaked, expected);
  assert.equal(failure.ok, false);
  assert.ok(failure.errors.some(({ code }) => code === "analytics-identity-leak"));
});

test("public hook closure accepts only explicit rejection and catches an open hook", async (t) => {
  const barrier = new MemoryBarrier();
  const closed = await startApp("web", barrier, { publicIngress: true });
  const open = await startApp("web", barrier, { openHook: true });
  t.after(async () => { await closed.close(); await open.close(); });
  const hookPaths = ["/api/__dlc/session", "/api/__dlc/barrier", "/api/__dlc/analytics"];
  const pass = await checkPublicHookClosure({
    baseUrls: [closed.app.baseUrl],
    hookPaths,
    graderTokenHeader: "x-dlc-grader-token",
    graderToken: "test-token",
  });
  assert.equal(pass.ok, true);
  const fail = await checkPublicHookClosure({
    baseUrls: [open.app.baseUrl],
    hookPaths,
    graderTokenHeader: "x-dlc-grader-token",
    graderToken: "test-token",
  });
  assert.equal(fail.ok, false);
  assert.equal(fail.errors.length, hookPaths.length * 2);
});
