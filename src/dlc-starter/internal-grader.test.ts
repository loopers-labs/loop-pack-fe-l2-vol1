import { afterEach, describe, expect, it, vi } from "vitest";
import { DLC_GRADER_TOKEN_HEADER, internalGraderDenial } from "./internal-grader";

describe("internal grader double gate", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("looks absent when the runtime opt-in is disabled", () => {
    vi.stubEnv("DLC_GRADER_ENABLED", "false");
    vi.stubEnv("DLC_GRADER_TOKEN", "secret");
    const request = new Request("http://localhost/internal", {
      headers: { [DLC_GRADER_TOKEN_HEADER]: "secret" },
    });

    expect(internalGraderDenial(request)?.status).toBe(404);
  });

  it("rejects missing and incorrect tokens when enabled", () => {
    vi.stubEnv("DLC_GRADER_ENABLED", "true");
    vi.stubEnv("DLC_GRADER_TOKEN", "secret");

    expect(internalGraderDenial(new Request("http://localhost/internal"))?.status).toBe(403);
    expect(
      internalGraderDenial(
        new Request("http://localhost/internal", {
          headers: { [DLC_GRADER_TOKEN_HEADER]: "wrong" },
        }),
      )?.status,
    ).toBe(403);
  });

  it("opens only when both gates pass", () => {
    vi.stubEnv("DLC_GRADER_ENABLED", "true");
    vi.stubEnv("DLC_GRADER_TOKEN", "secret");
    const request = new Request("http://localhost/internal", {
      headers: { [DLC_GRADER_TOKEN_HEADER]: "secret" },
    });

    expect(internalGraderDenial(request)).toBeNull();
  });
});
