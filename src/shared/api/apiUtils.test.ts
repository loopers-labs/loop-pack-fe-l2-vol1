import { afterEach, describe, expect, it, vi } from "vitest";
import { apiFetch, createApiUrl, createSameOriginApiUrl, parseApiError } from "./apiUtils";
import { AuthRequiredError } from "./AuthRequiredError";

describe("parseApiError", () => {
  it("API 응답 메시지를 Error로 변환한다", async () => {
    const error = await parseApiError(
      Response.json({ message: "이메일 또는 비밀번호를 확인해주세요." }, { status: 401 }),
      "요청에 실패했습니다.",
    );

    expect(error.message).toBe("이메일 또는 비밀번호를 확인해주세요.");
  });
});

describe("apiFetch", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("auth가 none이면 설정 가능한 API origin으로 credentials 없이 요청한다", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ ok: true }));
    vi.stubGlobal("window", {});
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "http://127.0.0.1:4010");

    await apiFetch("/api/products?page=1");

    expect(fetchMock).toHaveBeenCalledWith("http://127.0.0.1:4010/api/products?page=1", {});
  });

  it("auth가 optional이면 같은 origin에 세션 쿠키를 포함해 요청하고 401을 그대로 반환한다", async () => {
    const response = Response.json({ message: "로그인이 필요합니다." }, { status: 401 });
    const fetchMock = vi.fn().mockResolvedValue(response);
    vi.stubGlobal("window", {});
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiFetch("/api/auth/me", { auth: "optional" })).resolves.toBe(response);
    expect(fetchMock).toHaveBeenCalledWith("/api/auth/me", { credentials: "include" });
  });

  it("auth가 required이면 401 응답을 AuthRequiredError로 변환한다", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(Response.json({ message: "로그인이 필요합니다." }, { status: 401 }));
    vi.stubGlobal("window", {});
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiFetch("/api/orders", { auth: "required" })).rejects.toBeInstanceOf(
      AuthRequiredError,
    );
    expect(fetchMock).toHaveBeenCalledWith("/api/orders", { credentials: "include" });
  });
});

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

  it("브라우저에서는 기본적으로 상대 경로 API URL을 유지한다", () => {
    vi.stubGlobal("window", {});

    expect(createApiUrl("/api/products?page=1")).toBe("/api/products?page=1");
  });

  it("NEXT_PUBLIC_API_BASE_URL이 있으면 브라우저에서도 외부 API origin을 사용한다", () => {
    vi.stubGlobal("window", {});
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "http://127.0.0.1:4010");

    expect(createApiUrl("/api/products?page=1")).toBe("http://127.0.0.1:4010/api/products?page=1");
  });
});

describe("createSameOriginApiUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("브라우저에서는 NEXT_PUBLIC_API_BASE_URL이 있어도 같은 origin 상대 경로를 유지한다", () => {
    vi.stubGlobal("window", {});
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "http://127.0.0.1:4010");

    expect(createSameOriginApiUrl("/api/auth/login")).toBe("/api/auth/login");
  });

  it("서버에서는 APP_ORIGIN을 기준으로 같은 앱 API URL을 만든다", () => {
    vi.stubGlobal("window", undefined);
    vi.stubEnv("APP_ORIGIN", "https://commerce.example.com");

    expect(createSameOriginApiUrl("/api/auth/login")).toBe(
      "https://commerce.example.com/api/auth/login",
    );
  });
});
