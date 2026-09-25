import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const request = (token?: string) =>
  new NextRequest("http://localhost/api/__dlc/session", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { "x-dlc-grader-token": token } : {}),
    },
    body: JSON.stringify({ account: "customer-a", signingApp: "web" }),
  });

describe("POST /api/__dlc/session", () => {
  beforeEach(() => {
    vi.stubEnv("WEB_SESSION_SECRET", "web-test-secret");
    vi.stubEnv("ADMIN_SESSION_SECRET", "admin-test-secret");
    vi.stubEnv("DLC_GRADER_TOKEN", "grader-secret");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is closed to public traffic when fixture mode is disabled", async () => {
    vi.stubEnv("DLC_GRADER_ENABLED", "false");
    expect((await POST(request("grader-secret"))).status).toBe(404);
  });

  it("rejects public traffic without the internal token", async () => {
    vi.stubEnv("DLC_GRADER_ENABLED", "true");
    expect((await POST(request())).status).toBe(403);
    expect((await POST(request("wrong"))).status).toBe(403);
  });

  it("issues a fixture session only after both gates pass", async () => {
    vi.stubEnv("DLC_GRADER_ENABLED", "true");
    const response = await POST(request("grader-secret"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      account: "customer-a",
      signingApp: "web",
      audience: "web",
      cookieName: "dlc_web_session",
    });
    expect(body.token).toEqual(expect.any(String));
    expect(response.headers.get("set-cookie")).toContain("dlc_web_session=");
  });
});
