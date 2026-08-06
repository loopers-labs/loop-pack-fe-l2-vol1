import { afterEach, describe, expect, it, vi } from "vitest";
import { createApiUrl } from "./apiUtils";

describe("createApiUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("서버에서는 APP_ORIGIN을 기준으로 API URL을 만든다", () => {
    vi.stubGlobal("window", undefined);
    vi.stubEnv("APP_ORIGIN", "https://commerce.example.com");

    expect(createApiUrl("/api/products?page=1")).toBe(
      "https://commerce.example.com/api/products?page=1",
    );
  });

  it("INTERNAL_API_BASE_URL이 있으면 서버 내부 API origin을 우선한다", () => {
    vi.stubGlobal("window", undefined);
    vi.stubEnv("APP_ORIGIN", "https://commerce.example.com");
    vi.stubEnv("INTERNAL_API_BASE_URL", "http://127.0.0.1:3000");

    expect(createApiUrl("/api/products?page=1")).toBe("http://127.0.0.1:3000/api/products?page=1");
  });
});
