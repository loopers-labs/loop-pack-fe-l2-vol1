import { describe, expect, it } from "vitest";
import { pageParser } from "./use-list-query";

// C17: parseAsInteger는 "0"→0, "-1"→-1을 통과시키지만 route.ts:19의
// /^[1-9]\d*$/는 그 값을 400으로 거부한다. pageParser는 그 간극을 순수 파싱 단계에서
// 막는 커스텀 클램프이므로, 렌더 없이 parse 함수만 단위 테스트한다.
describe("pageParser", () => {
  it("키가 없으면 기본값 1을 쓴다", () => {
    expect(pageParser.defaultValue).toBe(1);
  });

  it.each([
    ["", 1],
    ["abc", 1],
    ["0", 1],
    ["-1", 1],
    ["01", 1],
    ["1.5", 1],
    ["1e3", 1],
    ["2abc", 2],
    ["999", 999],
  ])("parse(%s) → %i", (input, expected) => {
    expect(pageParser.parse(input)).toBe(expected);
  });

  // C3: route.ts:47은 isPositiveInteger만이 아니라 Number.isSafeInteger(page)도 함께
  // 본다. MAX_SAFE_INTEGER 자체는 route가 통과시키므로 파서도 그대로 통과시켜야 하고
  // (아래 첫 케이스), 그보다 큰 값은 route가 400으로 거부하므로 파서가 1로 미리
  // 되돌려야 한다(아래 나머지 두 케이스) — 그래야 회복 불가능한 에러 화면으로 안 간다.
  it.each([
    ["9007199254740991", 9007199254740991], // Number.MAX_SAFE_INTEGER — route 통과
    ["9007199254740993", 1], // MAX_SAFE_INTEGER + 2 — route 거부
    ["99999999999999999", 1], // 안전 정수 범위 밖 — route 거부
  ])("parse(%s) → %i (Number.isSafeInteger 경계)", (input, expected) => {
    expect(pageParser.parse(input)).toBe(expected);
  });
});
