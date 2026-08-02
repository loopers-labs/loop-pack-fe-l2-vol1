import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchJson, HttpError, isHttpError } from "./index";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("HttpError", () => {
  it("HTTP status를 보존한다", () => {
    const error = new HttpError(503);

    expect(error.status).toBe(503);
  });

  it("isHttpError가 HttpError를 좁힌다", () => {
    const error: Error = new HttpError(404);

    expect(isHttpError(error)).toBe(true);
    if (isHttpError(error)) {
      expect(error.status).toBe(404);
    }
  });
});

describe("fetchJson", () => {
  it("HTML 4xx 응답도 status를 보존한 HttpError로 변환한다", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("<html><body>Not found</body></html>", {
          status: 404,
          headers: { "content-type": "text/html" },
        }),
      ),
    );

    await expect(fetchJson<unknown>("/api/missing")).rejects.toMatchObject({
      name: "HttpError",
      status: 404,
      message: "HTTP request failed",
    });
  });

  it("빈 5xx 응답도 status를 보존한 HttpError로 변환한다", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 503 })));

    await expect(fetchJson<unknown>("/api/unavailable")).rejects.toMatchObject({
      name: "HttpError",
      status: 503,
      message: "HTTP request failed",
    });
  });

  it("JSON 오류 응답의 message를 보존한다", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(Response.json({ message: "상품을 찾을 수 없습니다." }, { status: 404 })),
    );

    await expect(fetchJson<unknown>("/api/missing")).rejects.toMatchObject({
      name: "HttpError",
      status: 404,
      message: "상품을 찾을 수 없습니다.",
    });
  });

  it("네트워크 실패는 HttpError가 아닌 원래 Error로 전파한다", async () => {
    const networkError = new Error("network unavailable");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(networkError));

    await expect(fetchJson<unknown>("/api/unavailable")).rejects.toBe(networkError);
    expect(isHttpError(networkError)).toBe(false);
  });
});
