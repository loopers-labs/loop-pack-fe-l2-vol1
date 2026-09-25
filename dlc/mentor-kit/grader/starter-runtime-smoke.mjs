import {
  createCanonicalSessionCases,
  createHttpBarrierControl,
  mintSessionCookie,
  runSameInstanceIsolation,
  runSessionMatrix,
} from "./runtime-contract.mjs";

const baseUrl = process.env.DLC_STARTER_URL ?? "http://127.0.0.1:3100";
const graderToken = process.env.DLC_GRADER_TOKEN;
if (!graderToken) throw new Error("DLC_GRADER_TOKEN is required");
const barrierControlUrl = process.env.DLC_BARRIER_CONTROL_URL;
const mentorAdminToken = process.env.MENTOR_SERVICE_ADMIN_TOKEN;
if (!barrierControlUrl || !mentorAdminToken) {
  throw new Error("DLC_BARRIER_CONTROL_URL and MENTOR_SERVICE_ADMIN_TOKEN are required");
}
const barrierControl = createHttpBarrierControl({
  baseUrl: barrierControlUrl,
  adminToken: mentorAdminToken,
});

const apps = {
  web: { baseUrl, internalBaseUrl: baseUrl, viewerPath: "/api/dlc/viewer" },
  admin: { baseUrl, internalBaseUrl: baseUrl, viewerPath: "/api/admin/viewer" },
};
const accounts = {
  customerA: "customer-a",
  customerB: "customer-b",
  adminA: "admin-a",
  adminB: "admin-b",
};
const contracts = {
  sessionFixturePath: "/api/__dlc/session",
  graderTokenHeader: "x-dlc-grader-token",
};
const headers = {
  instanceHeader: "x-dlc-instance-id",
  requestHeader: "x-dlc-request-id",
  barrierHeader: "x-dlc-barrier-id",
  graderTokenHeader: "x-dlc-grader-token",
  graderToken,
};

const cases = await createCanonicalSessionCases({ apps, accounts, contracts, graderToken });
const sessions = await runSessionMatrix({ apps, cases });

const webCustomerB = await mintSessionCookie({
  app: apps.web,
  contracts,
  graderToken,
  accountAlias: accounts.customerB,
  signingApp: "web",
  audience: "web",
});
const adminB = await mintSessionCookie({
  app: apps.admin,
  contracts,
  graderToken,
  accountAlias: accounts.adminB,
  signingApp: "admin",
  audience: "admin",
});
const web = await runSameInstanceIsolation({
  app: apps.web,
  actors: [
    { cookie: cases.find(({ name }) => name === "web-valid-customer").cookie, expectedBody: { viewer: { alias: "customer-a", role: "customer" } } },
    { cookie: webCustomerB, expectedBody: { viewer: { alias: "customer-b", role: "customer" } } },
  ],
  headers,
  barrierControl,
  barrierId: "starter-web-barrier",
});
const admin = await runSameInstanceIsolation({
  app: apps.admin,
  actors: [
    { cookie: cases.find(({ name }) => name === "admin-valid-admin").cookie, expectedBody: { viewer: { alias: "admin-a", role: "admin" } } },
    { cookie: adminB, expectedBody: { viewer: { alias: "admin-b", role: "admin" } } },
  ],
  headers,
  barrierControl,
  barrierId: "starter-admin-barrier",
});

const result = { ok: sessions.ok && web.ok && admin.ok, sessions, web, admin };
console.log(JSON.stringify(result, null, 2));
if (!result.ok) process.exitCode = 1;
