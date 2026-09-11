import { describe, expect, it } from "vitest";

import { DEFAULT_PAGE_SIZE } from "@/features/products/model/pagination";
import { loadProductListSearchParams, parseAsPage } from "@/features/products/model/searchParams";

// page는 1 이상 정수만 통과시키고, 나머지는 null로 돌려보낸다(nuqs가 기본값 1로 되돌린다).
// 상한은 두지 않는다 — 아주 큰 수는 서버가 isSafeInteger·범위로 다시 거른다.
describe("parseAsPage.parse", () => {
  it("1 이상 정수는 그대로 통과한다 (1이 최소 유효값)", () => {
    expect(parseAsPage.parse("1")).toBe(1);
    expect(parseAsPage.parse("2")).toBe(2);
    expect(parseAsPage.parse("30")).toBe(30);
  });

  it("0과 음수는 걸러져 null이 된다", () => {
    expect(parseAsPage.parse("0")).toBeNull();
    expect(parseAsPage.parse("-3")).toBeNull();
  });

  it("정수가 아닌 소수는 null이 된다", () => {
    expect(parseAsPage.parse("2.5")).toBeNull();
  });

  it("숫자로 읽히지 않거나 빈 값은 null이 된다", () => {
    expect(parseAsPage.parse("abc")).toBeNull();
    expect(parseAsPage.parse("3abc")).toBeNull();
    expect(parseAsPage.parse("")).toBeNull();
  });

  it("null·undefined도 방어적으로 null이 된다", () => {
    expect(parseAsPage.parse(null as never)).toBeNull();
    expect(parseAsPage.parse(undefined as never)).toBeNull();
  });

  it("아주 큰 정수는 통과시킨다 — 상한 검사는 서버 몫이다", () => {
    expect(parseAsPage.parse("999999999")).toBe(999999999);
  });
});

// 빈 URL 진입 시 우리가 정한 파서 기본값으로 채워지는지 — parseAsPage 외 다른 파서 기본값도 고정한다.
describe("loadProductListSearchParams 기본값", () => {
  it("빈 URL로 진입하면 각 조건이 기본값으로 채워진다", async () => {
    const parsed = await loadProductListSearchParams(new URLSearchParams());
    expect(parsed).toEqual({
      q: "",
      category: "all",
      sort: "latest",
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
    });
  });
});
