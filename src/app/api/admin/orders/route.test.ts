import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createDlcSessionToken, DLC_SESSION_COOKIE } from "@/dlc-starter/session";
import { GET } from "./route";

const adminRequest = (token?: string) => {
  const request = new NextRequest("http://admin.local/api/admin/orders");
  if (token) {
    request.cookies.set(DLC_SESSION_COOKIE.admin, token);
  }
  return request;
};

describe("GET /api/admin/orders", () => {
  beforeEach(() => {
    vi.stubEnv("ADMIN_SESSION_SECRET", "admin-test-secret");
    vi.stubEnv("WEB_SESSION_SECRET", "web-test-secret");
    vi.stubEnv("COMMERCE_API_URL", "http://commerce-api.internal:4000");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("calls the mentor commerce API directly for an admin", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({
        orders: [{ id: "order-1", customerId: "dlc-customer-a", status: "paid" }],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const token = createDlcSessionToken({ accountAlias: "admin-a", signingApp: "admin" });

    const response = await GET(adminRequest(token));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ orders: [{ id: "order-1" }] });
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe("http://commerce-api.internal:4000/orders");
    expect(init.headers).toMatchObject({
      "x-dlc-viewer-id": "dlc-admin-a",
      "x-dlc-viewer-role": "admin",
    });
  });

  it("rejects unauthenticated traffic without calling upstream", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    expect((await GET(adminRequest())).status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
