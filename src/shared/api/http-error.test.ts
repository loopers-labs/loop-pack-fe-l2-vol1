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
  it("네트워크 실패는 HttpError가 아닌 원래 Error로 전파한다", async () => {
    const networkError = new Error("network unavailable");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(networkError));

    await expect(fetchJson<unknown>("/api/unavailable")).rejects.toBe(networkError);
    expect(isHttpError(networkError)).toBe(false);
  });
});
