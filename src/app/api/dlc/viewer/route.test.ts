import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createDlcSessionToken, DLC_SESSION_COOKIE } from "@/dlc-starter/session";
import { GET as getAdminViewer } from "../../admin/viewer/route";
import { GET as getWebViewer } from "./route";

const requestWithCookie = (path: string, name: string, token: string) => {
  const request = new NextRequest(`http://localhost${path}`, {
    headers: { "x-dlc-request-id": "request-123" },
  });
  request.cookies.set(name, token);
  return request;
};

describe("DLC viewer routes", () => {
  beforeEach(() => {
    vi.stubEnv("WEB_SESSION_SECRET", "web-test-secret");
    vi.stubEnv("ADMIN_SESSION_SECRET", "admin-test-secret");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns the customer sentinel with stable instance and request headers", async () => {
    const token = createDlcSessionToken({ accountAlias: "customer-b", signingApp: "web" });
    const response = await getWebViewer(
      requestWithCookie("/api/dlc/viewer", DLC_SESSION_COOKIE.web, token),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      viewer: { alias: "customer-b", role: "customer" },
    });
    expect(response.headers.get("x-dlc-instance-id")).toEqual(expect.any(String));
    expect(response.headers.get("x-dlc-request-id")).toBe("request-123");
  });

  it("rejects role, audience and cookie replay across apps", async () => {
    const customer = createDlcSessionToken({ accountAlias: "customer-a", signingApp: "web" });
    const wrongAudience = createDlcSessionToken({
      accountAlias: "admin-a",
      signingApp: "admin",
      audience: "web",
    });

    expect(
      (await getAdminViewer(
        requestWithCookie("/api/admin/viewer", DLC_SESSION_COOKIE.admin, customer),
      )).status,
    ).toBe(401);
    expect(
      (await getAdminViewer(
        requestWithCookie("/api/admin/viewer", DLC_SESSION_COOKIE.admin, wrongAudience),
      )).status,
    ).toBe(401);
  });

  it("rejects a public barrier header instead of activating the latch", async () => {
    vi.stubEnv("DLC_GRADER_ENABLED", "false");
    const token = createDlcSessionToken({ accountAlias: "customer-a", signingApp: "web" });
    const request = requestWithCookie("/api/dlc/viewer", DLC_SESSION_COOKIE.web, token);
    request.headers.set("x-dlc-barrier-id", "public-attempt");

    expect((await getWebViewer(request)).status).toBe(404);
  });

  it("releases two same-instance viewers at the internal barrier", async () => {
    vi.stubEnv("DLC_GRADER_ENABLED", "true");
    vi.stubEnv("DLC_GRADER_TOKEN", "grader-secret");
    const first = createDlcSessionToken({ accountAlias: "customer-a", signingApp: "web" });
    const second = createDlcSessionToken({ accountAlias: "customer-b", signingApp: "web" });
    const firstRequest = requestWithCookie("/api/dlc/viewer", DLC_SESSION_COOKIE.web, first);
    const secondRequest = requestWithCookie("/api/dlc/viewer", DLC_SESSION_COOKIE.web, second);
    for (const request of [firstRequest, secondRequest]) {
      request.headers.set("x-dlc-barrier-id", "race-1");
      request.headers.set("x-dlc-grader-token", "grader-secret");
    }

    const [firstResponse, secondResponse] = await Promise.all([
      getWebViewer(firstRequest),
      getWebViewer(secondRequest),
    ]);
    const [firstBody, secondBody] = await Promise.all([
      firstResponse.json(),
      secondResponse.json(),
    ]);

    expect(firstBody.viewer.alias).toBe("customer-a");
    expect(secondBody.viewer.alias).toBe("customer-b");
    expect(firstResponse.headers.get("x-dlc-instance-id")).toBe(
      secondResponse.headers.get("x-dlc-instance-id"),
    );
  });
});
