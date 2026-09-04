import { describe, expect, it } from "vitest";
import { DEFAULT_NEXT_PATH, safeNextPath } from "./safeNextPath";

// 복원 경로는 공격자가 고르는 값이다. 통과시켜야 할 것과 막아야 할 것을 함께 둔다 —
// 막는 것만 단언하면 함수가 전부 "/"를 돌려줘도 초록불이다.
describe("safeNextPath — 외부로 나가는 값을 막는다", () => {
  it.each([
    ["절대 URL", "https://evil.example"],
    ["프로토콜 상대 URL", "//evil.example"],
    ["백슬래시 (일부 브라우저가 슬래시로 정규화한다)", "/\\evil.example"],
    ["인코딩된 프로토콜 상대 URL", "%2F%2Fevil.example"],
    ["스킴", "javascript:alert(1)"],
    ["빈 문자열", ""],
    ["깨진 퍼센트 이스케이프", "%E0%A4%A"],
  ])("%s은 기본 경로로 떨어뜨린다 (%s)", (_label, input) => {
    expect(safeNextPath(input)).toBe(DEFAULT_NEXT_PATH);
  });

  it("값이 없으면 기본 경로다", () => {
    expect(safeNextPath(null)).toBe(DEFAULT_NEXT_PATH);
    expect(safeNextPath(undefined)).toBe(DEFAULT_NEXT_PATH);
  });
});

describe("safeNextPath — 앱 안의 경로는 그대로 통과시킨다", () => {
  it.each([
    ["/orders", "/orders"],
    ["/checkout", "/checkout"],
    // proxy가 만들어 넣는 실제 모양이다. 쿼리까지 살아야 주문서가 무엇을 살지 안다.
    ["%2Fcheckout%3FproductId%3Dp3%26quantity%3D2", "/checkout?productId=p3&quantity=2"],
  ])("%s → %s", (input, expected) => {
    expect(safeNextPath(input)).toBe(expected);
  });
});
