// isServerError — 첫 로드 에러 경계로 넘길지 가르는 순수 분류.
// 서버 오류(5xx)·네트워크 단절만 경계 화면으로 넘기고, 4xx(잘못된 요청)는 화면 안에서 다룬다.
// 이 분류가 week8 검증대상 6(5xx=경계 / 4xx=인라인)의 분기 규칙 그 자체다.
import { describe, expect, test } from "vitest";
import { HttpError, NetworkError, isServerError } from "./apiError";

describe("week8 검증대상 3-4 — isServerError — 5xx·네트워크만 경계로 넘긴다", () => {
  test("네트워크 단절은 경계로 넘긴다", () => {
    expect(isServerError(new NetworkError("offline"))).toBe(true);
  });

  test("5xx 는 경계로 넘긴다", () => {
    expect(isServerError(new HttpError(500, "server error"))).toBe(true);
    expect(isServerError(new HttpError(503, "unavailable"))).toBe(true);
  });

  test("4xx 는 경계로 넘기지 않는다(화면 안에서 처리)", () => {
    expect(isServerError(new HttpError(400, "bad request"))).toBe(false);
    expect(isServerError(new HttpError(404, "not found"))).toBe(false);
  });

  test("경계: 499 는 넘기지 않고 500 은 넘긴다", () => {
    expect(isServerError(new HttpError(499, "client"))).toBe(false);
    expect(isServerError(new HttpError(500, "server"))).toBe(true);
  });

  test("경계: HttpError·NetworkError 가 아닌 값은 경계로 넘기지 않는다", () => {
    expect(isServerError(new Error("generic"))).toBe(false);
    expect(isServerError("boom")).toBe(false);
    expect(isServerError(null)).toBe(false);
  });
});
