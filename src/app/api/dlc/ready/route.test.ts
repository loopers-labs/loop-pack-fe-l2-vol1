import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

describe("GET /api/dlc/ready", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("reports ready only when session config and commerce API are ready", async () => {
    vi.stubEnv("WEB_SESSION_SECRET", "web-test-secret");
    vi.stubEnv("COMMERCE_API_URL", "http://commerce-api.internal:4000");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 204 })));

    const response = await GET(new NextRequest("http://localhost/api/dlc/ready"));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      status: "ready",
      checks: { sessionConfigured: true, commerceReady: true },
    });
  });

  it("fails closed when required configuration is absent", async () => {
    vi.stubEnv("WEB_SESSION_SECRET", "");
    vi.stubEnv("COMMERCE_API_URL", "");

    const response = await GET(new NextRequest("http://localhost/api/dlc/ready"));
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ status: "not-ready" });
  });
});
