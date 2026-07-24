import { describe, expect, it } from "vitest";
import { formatWon } from "./format";

describe("formatWon", () => {
  it("천단위 콤마와 원 접미사를 붙인다", () => {
    expect(formatWon(21000)).toBe("21,000원");
  });

  it("네 자리 금액(2100)도 콤마를 붙인다", () => {
    expect(formatWon(2100)).toBe("2,100원");
  });

  it("네 자리 금액(4200)도 콤마를 붙인다", () => {
    expect(formatWon(4200)).toBe("4,200원");
  });

  it("0원은 콤마 없이 표기한다", () => {
    expect(formatWon(0)).toBe("0원");
  });

  it("세 자리 이하는 콤마 없이 표기한다", () => {
    expect(formatWon(999)).toBe("999원");
  });

  it("백만 단위도 콤마를 붙인다", () => {
    expect(formatWon(1000000)).toBe("1,000,000원");
  });
});
