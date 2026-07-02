import { describe, it, expect } from "vitest";
import { splitHighlightParts } from ".";

// 결함 증명: 검색어를 그대로 `new RegExp("(" + q + ")")` 에 넣던 옛 코드는
// "(" 같은 정규식 특수문자 입력 시 "Invalid regular expression" 으로 throw 했다.
// escapeRegExp 적용을 제거하면 이 테스트는 빨갛게 실패한다.
describe("splitHighlightParts — 정규식 특수문자 검색 (결함 증명)", () => {
  it("'(' 를 검색해도 throw 하지 않는다", () => {
    expect(() => splitHighlightParts("a(b)c", "(")).not.toThrow();
  });

  it("특수문자도 일반 문자처럼 매치로 표시한다", () => {
    const parts = splitHighlightParts("a(b)c", "(");
    expect(parts.some((part) => part.isMatch && part.text === "(")).toBe(true);
    // 원본 텍스트는 손실 없이 복원된다
    expect(parts.map((part) => part.text).join("")).toBe("a(b)c");
  });
});
