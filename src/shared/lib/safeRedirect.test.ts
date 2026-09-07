// safeRedirect 단위 테스트 — 오픈 리다이렉트 차단 계약(입력→출력)만 검증한다.
// same-origin 절대경로만 그대로 통과하고, 외부로 튈 여지가 있는 값은 전부 홈("/")으로 환원된다.

import { describe, expect, test } from "vitest";
import { safeRedirect } from "@/shared/lib";

const HOME = "/";

describe("safeRedirect — 안전한 same-origin 경로는 그대로 통과", () => {
  test.each(["/orders", "/orders?page=2"])(
    "%s 는 변형 없이 그대로 돌려준다",
    (path) => {
      expect(safeRedirect(path)).toBe(path);
    },
  );
});

describe("safeRedirect — 외부로 튈 수 있는 입력은 홈으로 환원", () => {
  test.each<[string, string | null | undefined]>([
    ["null", null],
    ["undefined", undefined],
    ["빈 문자열", ""],
    ["절대 URL(https)", "https://evil.com"],
    ["javascript 스킴", "javascript:alert(1)"],
    ["프로토콜 상대 경로", "//evil.com"],
    ["백슬래시 트릭", "/\\evil.com"],
    ["스킴 포함 경로", "/redirect?next=https://evil.com"],
  ])("%s 은 홈으로 돌린다", (_label, candidate) => {
    expect(safeRedirect(candidate)).toBe(HOME);
  });
});
