import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createDlcSessionToken, DLC_SESSION_COOKIE } from "@/dlc-starter/session";
import { PATCH } from "./route";

const statusRequest = (token: string, status: string) => {
  const request = new NextRequest("http://admin.local/api/admin/orders/order-1/status", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ status }),
  });
  request.cookies.set(DLC_SESSION_COOKIE.admin, token);
  return request;
};

describe("PATCH /api/admin/orders/:orderId/status", () => {
  beforeEach(() => {
    vi.stubEnv("ADMIN_SESSION_SECRET", "admin-test-secret");
    vi.stubEnv("COMMERCE_API_URL", "http://commerce-api.internal:4000");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("forwards the minimal status mutation to the commerce API", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(Response.json({ order: { id: "order-1", status: "preparing" } }));
    vi.stubGlobal("fetch", fetchMock);
    const token = createDlcSessionToken({ accountAlias: "admin-b", signingApp: "admin" });

    const response = await PATCH(statusRequest(token, "preparing"), {
      params: Promise.resolve({ orderId: "order-1" }),
    });

    expect(response.status).toBe(200);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe("http://commerce-api.internal:4000/orders/order-1/status");
    expect(init).toMatchObject({ method: "PATCH", body: JSON.stringify({ status: "preparing" }) });
  });

  it("rejects statuses outside the starter contract", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const token = createDlcSessionToken({ accountAlias: "admin-a", signingApp: "admin" });

    const response = await PATCH(statusRequest(token, "unknown"), {
      params: Promise.resolve({ orderId: "order-1" }),
    });

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
