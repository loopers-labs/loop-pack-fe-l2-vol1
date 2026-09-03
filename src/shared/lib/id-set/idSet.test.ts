import { describe, expect, it } from "vitest";
import { normalizeIdSet } from "./idSet";

describe("normalizeIdSet", () => {
  it("유효한 id set은 그대로 유지한다", () => {
    const idSet = normalizeIdSet({ p1: true, p2: true });

    expect(idSet).toEqual({ p1: true, p2: true });
  });

  it.each([undefined, null, "wrong", ["p1"]])(
    "객체가 아닌 값이나 배열 %j은 빈 id set으로 정규화한다",
    (value) => {
      const idSet = normalizeIdSet(value);

      expect(idSet).toEqual({});
    },
  );

  it("true 값으로 표시된 상품 id만 유지한다", () => {
    const idSet = normalizeIdSet({ p1: true, p2: false, p3: "true", p4: true });

    expect(idSet).toEqual({ p1: true, p4: true });
  });

  it("빈 문자열이나 공백 상품 id는 제거한다", () => {
    const idSet = normalizeIdSet({ "": true, "   ": true, p1: true });

    expect(idSet).toEqual({ p1: true });
  });
});
