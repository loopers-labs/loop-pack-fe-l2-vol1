import { issue, validationResult } from "./result.mjs";

const REQUIRED_SESSION_CASES = [
  "web-valid-customer",
  "admin-valid-admin",
  "web-reject-admin-role",
  "admin-reject-customer-role",
  "web-reject-wrong-audience",
  "admin-reject-wrong-audience",
  "web-reject-admin-signature",
  "admin-reject-web-signature",
  "web-reject-admin-cookie-replay",
  "admin-reject-web-cookie-replay",
];
const REQUEST_TIMEOUT_MS = 5_000;

function joinUrl(baseUrl, targetPath) {
  return new URL(targetPath, baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`).toString();
}

function isSubset(actual, expected) {
  if (expected === null || typeof expected !== "object") return Object.is(actual, expected);
  if (Array.isArray(expected)) {
    return Array.isArray(actual) && expected.length === actual.length && expected.every((value, index) => isSubset(actual[index], value));
  }
  if (actual === null || typeof actual !== "object") return false;
  return Object.entries(expected).every(([key, value]) => isSubset(actual[key], value));
}

async function responseBody(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function requestViewer(app, cookie, headers = {}) {
  const response = await fetch(joinUrl(app.baseUrl, app.viewerPath), {
    headers: {
      accept: "application/json",
      ...(cookie ? { cookie } : {}),
      ...headers,
    },
    redirect: "manual",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  return { response, body: await responseBody(response) };
}

function cookiePair(setCookie) {
  return setCookie.split(";", 1)[0];
}

function renameCookie(source, target) {
  const sourceValue = cookiePair(source).slice(cookiePair(source).indexOf("=") + 1);
  const targetName = cookiePair(target).slice(0, cookiePair(target).indexOf("="));
  return `${targetName}=${sourceValue}`;
}

export async function mintSessionCookie({ app, contracts, graderToken, accountAlias, signingApp, audience }) {
  const baseUrl = app.internalBaseUrl ?? app.baseUrl;
  const response = await fetch(joinUrl(baseUrl, contracts.sessionFixturePath), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      [contracts.graderTokenHeader]: graderToken,
    },
    body: JSON.stringify({ account: accountAlias, signingApp, audience }),
    redirect: "manual",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (response.status !== 201 && response.status !== 200) {
    throw new Error(`session fixture가 ${response.status}로 응답했습니다.`);
  }
  const setCookies = typeof response.headers.getSetCookie === "function"
    ? response.headers.getSetCookie()
    : [response.headers.get("set-cookie")].filter(Boolean);
  if (setCookies.length !== 1) {
    throw new Error(`session fixture는 정확히 한 개의 Set-Cookie를 반환해야 합니다: ${setCookies.length}`);
  }
  return cookiePair(setCookies[0]);
}

export async function createCanonicalSessionCases({ apps, accounts, contracts, graderToken }) {
  const webCustomer = await mintSessionCookie({ app: apps.web, contracts, graderToken, accountAlias: accounts.customerA, signingApp: "web", audience: "web" });
  const adminAdmin = await mintSessionCookie({ app: apps.admin, contracts, graderToken, accountAlias: accounts.adminA, signingApp: "admin", audience: "admin" });
  const webAdminRole = await mintSessionCookie({ app: apps.web, contracts, graderToken, accountAlias: accounts.adminA, signingApp: "web", audience: "web" });
  const adminCustomerRole = await mintSessionCookie({ app: apps.admin, contracts, graderToken, accountAlias: accounts.customerA, signingApp: "admin", audience: "admin" });
  const webWrongAudience = await mintSessionCookie({ app: apps.web, contracts, graderToken, accountAlias: accounts.customerA, signingApp: "web", audience: "admin" });
  const adminWrongAudience = await mintSessionCookie({ app: apps.admin, contracts, graderToken, accountAlias: accounts.adminA, signingApp: "admin", audience: "web" });
  const customerSignedByAdmin = await mintSessionCookie({ app: apps.admin, contracts, graderToken, accountAlias: accounts.customerA, signingApp: "admin", audience: "web" });
  const adminSignedByWeb = await mintSessionCookie({ app: apps.web, contracts, graderToken, accountAlias: accounts.adminA, signingApp: "web", audience: "admin" });
  return [
    { name: "web-valid-customer", app: "web", cookie: webCustomer, expectedStatus: 200, expectedBody: { viewer: { id: `dlc-${accounts.customerA}`, alias: accounts.customerA, role: "customer" } } },
    { name: "admin-valid-admin", app: "admin", cookie: adminAdmin, expectedStatus: 200, expectedBody: { viewer: { id: `dlc-${accounts.adminA}`, alias: accounts.adminA, role: "admin" } } },
    { name: "web-reject-admin-role", app: "web", cookie: webAdminRole, expectedStatus: [401, 403] },
    { name: "admin-reject-customer-role", app: "admin", cookie: adminCustomerRole, expectedStatus: [401, 403] },
    { name: "web-reject-wrong-audience", app: "web", cookie: webWrongAudience, expectedStatus: [401, 403] },
    { name: "admin-reject-wrong-audience", app: "admin", cookie: adminWrongAudience, expectedStatus: [401, 403] },
    { name: "web-reject-admin-signature", app: "web", cookie: renameCookie(customerSignedByAdmin, webCustomer), expectedStatus: [401, 403] },
    { name: "admin-reject-web-signature", app: "admin", cookie: renameCookie(adminSignedByWeb, adminAdmin), expectedStatus: [401, 403] },
    { name: "web-reject-admin-cookie-replay", app: "web", cookie: renameCookie(adminAdmin, webCustomer), expectedStatus: [401, 403] },
    { name: "admin-reject-web-cookie-replay", app: "admin", cookie: renameCookie(webCustomer, adminAdmin), expectedStatus: [401, 403] },
  ];
}

export async function runSessionMatrix({ apps, cases, requireCanonicalCases = true }) {
  const errors = [];
  const names = new Set(cases.map((entry) => entry.name));
  if (requireCanonicalCases) {
    for (const name of REQUIRED_SESSION_CASES) {
      if (!names.has(name)) errors.push(issue("missing-session-case", `session.${name}`, "필수 role/audience/cookie replay case가 없습니다."));
    }
  }
  for (const testCase of cases) {
    const app = apps[testCase.app];
    if (!app) {
      errors.push(issue("unknown-app", `session.${testCase.name}`, `${testCase.app} app 설정이 없습니다.`));
      continue;
    }
    try {
      const { response, body } = await requestViewer(app, testCase.cookie, testCase.headers);
      const expectedStatuses = Array.isArray(testCase.expectedStatus)
        ? testCase.expectedStatus
        : [testCase.expectedStatus];
      if (!expectedStatuses.includes(response.status)) {
        errors.push(issue("unexpected-status", `session.${testCase.name}`, `기대 ${expectedStatuses.join("/")}, 실제 ${response.status}`));
      }
      if (testCase.expectedBody && !isSubset(body, testCase.expectedBody)) {
        errors.push(issue("viewer-mismatch", `session.${testCase.name}`, `viewer 응답이 기대 sentinel과 다릅니다: ${JSON.stringify(body)}`));
      }
    } catch (error) {
      errors.push(issue("request-failed", `session.${testCase.name}`, error.message));
    }
  }
  return validationResult(errors);
}

export function createHttpBarrierControl({ baseUrl, adminToken }) {
  if (!baseUrl || !adminToken) throw new Error("barrier baseUrl과 adminToken이 필요합니다.");
  const request = async (barrierId, suffix, init) => {
    const response = await fetch(
      joinUrl(baseUrl, `/__grader/barriers/${encodeURIComponent(barrierId)}${suffix}`),
      {
        ...init,
        headers: {
          authorization: `Bearer ${adminToken}`,
          "content-type": "application/json",
          ...init?.headers,
        },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      },
    );
    const body = await responseBody(response);
    if (!response.ok) throw new Error(`mentor barrier ${suffix || "inspect"}가 ${response.status}로 응답했습니다: ${JSON.stringify(body)}`);
    return body;
  };
  return {
    prepare: (barrierId, expected) => request(barrierId, "/prepare", {
      method: "POST",
      body: JSON.stringify({ expected }),
    }),
    inspect: (barrierId) => request(barrierId, "", { method: "GET" }),
  };
}

export async function runSameInstanceIsolation({
  app,
  actors,
  headers,
  barrierControl,
  barrierId = `dlc-${Date.now()}`,
}) {
  const errors = [];
  if (!Array.isArray(actors) || actors.length !== 2) {
    return validationResult([issue("actor-contract", "isolation.actors", "정확히 두 actor가 필요합니다.")]);
  }
  if (!barrierControl?.prepare || !barrierControl?.inspect) {
    return validationResult([issue("barrier-control", "isolation.barrier", "mentor-owned barrier control이 필요합니다.")]);
  }
  try {
    await barrierControl.prepare(barrierId, 2);
  } catch (error) {
    return validationResult([issue("barrier-prepare", "isolation.barrier", error.message)]);
  }
  const runActor = async (actor, index) => {
    const requestId = `${barrierId}-${index + 1}`;
    const result = await requestViewer(app, actor.cookie, {
      [headers.requestHeader]: requestId,
      [headers.barrierHeader]: barrierId,
      [headers.graderTokenHeader]: headers.graderToken,
    });
    return { ...result, actor, requestId };
  };

  const first = runActor(actors[0], 0);
  const second = runActor(actors[1], 1);
  const results = await Promise.all([first, second]);

  const instanceIds = new Set();
  results.forEach(({ response, body, actor, requestId }, index) => {
    if (response.status !== 200) {
      errors.push(issue("unexpected-status", `isolation.actor${index + 1}`, `viewer status가 ${response.status}입니다.`));
    }
    if (!isSubset(body, actor.expectedBody)) {
      errors.push(issue("viewer-leak", `isolation.actor${index + 1}`, `기대 ${JSON.stringify(actor.expectedBody)}, 실제 ${JSON.stringify(body)}`));
    }
    const instance = response.headers.get(headers.instanceHeader);
    const echoedRequest = response.headers.get(headers.requestHeader);
    const echoedBarrier = response.headers.get(headers.barrierHeader);
    if (!instance) errors.push(issue("missing-instance-header", `isolation.actor${index + 1}`, headers.instanceHeader));
    else instanceIds.add(instance);
    if (echoedRequest !== requestId) {
      errors.push(issue("request-correlation", `isolation.actor${index + 1}`, `request ID가 보존되지 않았습니다.`));
    }
    if (echoedBarrier !== barrierId) {
      errors.push(issue("barrier-not-observed", `isolation.actor${index + 1}`, `barrier header가 응답에 보존되지 않았습니다.`));
    }
  });
  if (instanceIds.size !== 1) {
    errors.push(issue("different-instance", "isolation", "두 요청이 같은 Next.js instance를 통과하지 않았습니다."));
  }
  try {
    const evidence = await barrierControl.inspect(barrierId);
    const expectedRequestIds = results.map(({ requestId }) => requestId).sort();
    const actualRequestIds = Array.isArray(evidence?.arrivals) ? [...evidence.arrivals].sort() : [];
    if (
      evidence?.expected !== 2 ||
      evidence?.released !== true ||
      evidence?.timedOut === true ||
      !isSubset(actualRequestIds, expectedRequestIds)
    ) {
      errors.push(issue("barrier-evidence", "isolation.barrier", `mentor barrier 증거가 일치하지 않습니다: ${JSON.stringify(evidence)}`));
    }
  } catch (error) {
    errors.push(issue("barrier-inspect", "isolation.barrier", error.message));
  }
  return validationResult(errors);
}

export function checkAnalyticsRecords(records, expectedByContext) {
  const errors = [];
  const grouped = new Map();
  for (const record of records) {
    if (typeof record.contextId !== "string") {
      errors.push(issue("analytics-context", "analytics", "모든 event에 contextId가 필요합니다."));
      continue;
    }
    const list = grouped.get(record.contextId) ?? [];
    list.push(record);
    grouped.set(record.contextId, list);
  }
  for (const [contextId, expected] of Object.entries(expectedByContext)) {
    const actual = grouped.get(contextId) ?? [];
    if (actual.length !== expected.length) {
      errors.push(issue("analytics-count", `analytics.${contextId}`, `기대 ${expected.length}, 실제 ${actual.length}`));
      continue;
    }
    let currentIdentity = null;
    actual.forEach((record, index) => {
      if (record.type === "identify") currentIdentity = record.identity;
      if (record.type === "reset") currentIdentity = null;
      if (record.type === "track" && record.identity !== currentIdentity) {
        errors.push(issue("analytics-identity-leak", `analytics.${contextId}[${index}]`, `현재 context identity ${currentIdentity} 대신 ${record.identity}가 기록됐습니다.`));
      }
      if (!isSubset(record, expected[index])) {
        errors.push(issue("analytics-event-mismatch", `analytics.${contextId}[${index}]`, `기대 event와 다릅니다.`));
      }
    });
  }
  for (const contextId of grouped.keys()) {
    if (!(contextId in expectedByContext)) {
      errors.push(issue("analytics-unknown-context", `analytics.${contextId}`, "예상하지 않은 browser context입니다."));
    }
  }
  return validationResult(errors);
}

export async function checkPublicHookClosure({
  baseUrls,
  hookPaths,
  graderTokenHeader,
  graderToken,
}) {
  const errors = [];
  if (!graderTokenHeader || !graderToken) {
    return validationResult([
      issue("public-hook-contract", "public", "실제 grader token으로 public ingress 차단을 검증해야 합니다."),
    ]);
  }
  const allowedRejectStatuses = new Set([401, 403, 404, 405]);
  for (const baseUrl of baseUrls) {
    for (const hookPath of hookPaths) {
      for (const method of ["GET", "POST"]) {
        try {
          const response = await fetch(joinUrl(baseUrl, hookPath), {
            method,
            headers: {
              [graderTokenHeader]: graderToken,
              "content-type": "application/json",
            },
            body: method === "POST" ? "{}" : undefined,
            redirect: "manual",
            signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
          });
          if (!allowedRejectStatuses.has(response.status)) {
            errors.push(issue("public-hook-open", `public.${method}.${hookPath}`, `${baseUrl}가 ${response.status}로 응답했습니다.`));
          }
        } catch (error) {
          errors.push(issue("request-failed", `public.${method}.${hookPath}`, error.message));
        }
      }
    }
  }
  return validationResult(errors);
}

export async function runRuntimeContract(config) {
  const sections = {};
  sections.sessions = await runSessionMatrix(config.sessions);
  sections.isolation = await runSameInstanceIsolation(config.isolation);
  sections.analytics = checkAnalyticsRecords(config.analytics.records, config.analytics.expectedByContext);
  sections.publicHooks = await checkPublicHookClosure(config.publicHooks);
  const errors = Object.entries(sections).flatMap(([section, result]) =>
    result.errors.map((entry) => ({ ...entry, path: `${section}.${entry.path}` })),
  );
  return { ...validationResult(errors), sections };
}
