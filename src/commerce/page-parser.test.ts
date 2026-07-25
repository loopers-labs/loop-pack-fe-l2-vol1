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
});
