import { describe, expect, it } from "vitest";
import * as slice from "./index";
import type { ApiErrorResponse } from "./index";

describe("shared/api 배럴(index.ts)", () => {
  it("runtime export가 새 공개 API 세 개다", () => {
    expect(Object.keys(slice).sort()).toEqual(["HttpError", "fetchJson", "isHttpError"]);
    expect(typeof slice.fetchJson).toBe("function");
    expect(typeof slice.HttpError).toBe("function");
    expect(typeof slice.isHttpError).toBe("function");
  });

  it("HttpError와 guard를 공개 배럴로 제공한다", () => {
    const error = new slice.HttpError(500, "boom");

    expect(error.status).toBe(500);
    expect(slice.isHttpError(error)).toBe(true);
    expect(slice.isHttpError(new Error("boom"))).toBe(false);
  });
});

type _ApiTypeContract = ApiErrorResponse;
