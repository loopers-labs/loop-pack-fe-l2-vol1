import { describe, expect, it } from "vitest";
import { resolveProductListQuery } from "./resolveProductListQuery";

// 3번 항목 — 직접 고른 순수 로직.
// 서버(generateMetadata·prefetch)가 URL을 조회 조건으로 좁히는 유일한 경로다.
// 여기가 nuqs 파서와 어긋나면 서버와 클라이언트가 다른 GET URL을 만들고,
// query key가 갈려 hydration 직후 목록이 한 번 더 요청된다.

const DEFAULTS = { q: "", category: "all", sort: "latest", page: 1 };

describe("resolveProductListQuery — 조건이 없을 때", () => {
  it("빈 searchParams는 nuqs 기본값과 같은 조건을 만든다", () => {
    expect(resolveProductListQuery({})).toEqual(DEFAULTS);
  });
});

describe("resolveProductListQuery — page 경계", () => {
  it("정상 페이지 번호는 숫자로 통과시킨다", () => {
    expect(resolveProductListQuery({ page: "3" }).page).toBe(3);
  });

  it.each([
    ["0", "0페이지는 없다"],
    ["-1", "음수 페이지는 없다"],
    ["abc", "숫자가 아니다"],
    ["", "빈 문자열"],
    ["1.5", "정수가 아니다"],
    ["1e999", "Infinity로 파싱된다"],
    ["99999999999999999999", "안전한 정수 범위를 넘는다"],
  ])("page=%s 는 1로 되돌린다 (%s)", (value) => {
    // 그대로 통과하면 서버는 이 값으로 prefetch하고 클라이언트는 1로 읽는다.
    // mock API는 page=0에 400을 준다.
    expect(resolveProductListQuery({ page: value }).page).toBe(1);
  });
});

describe("resolveProductListQuery — 리터럴 좁히기", () => {
  it("아는 카테고리는 통과시킨다", () => {
    expect(resolveProductListQuery({ category: "fashion" }).category).toBe("fashion");
  });

  it("모르는 카테고리는 all로 되돌린다", () => {
    expect(resolveProductListQuery({ category: "없는카테고리" }).category).toBe("all");
  });

  it("아는 정렬은 통과시킨다", () => {
    expect(resolveProductListQuery({ sort: "price-desc" }).sort).toBe("price-desc");
  });

  it("모르는 정렬은 latest로 되돌린다", () => {
    expect(resolveProductListQuery({ sort: "cheapest" }).sort).toBe("latest");
  });
});

describe("resolveProductListQuery — 같은 키가 여러 번 올 때", () => {
  it("배열로 오면 첫 값만 쓴다", () => {
    // ?q=a&q=b 는 Next가 배열로 준다. 배열을 그대로 쓰면 URLSearchParams에
    // "a,b"가 실려 서버·클라이언트가 다른 요청을 만든다.
    expect(resolveProductListQuery({ q: ["셔츠", "바지"] }).q).toBe("셔츠");
  });

  it("배열로 온 page도 첫 값으로 좁힌 뒤 경계를 본다", () => {
    expect(resolveProductListQuery({ page: ["0", "5"] }).page).toBe(1);
  });

  it("빈 배열은 기본값으로 떨어진다", () => {
    expect(resolveProductListQuery({ category: [] }).category).toBe("all");
  });
});

describe("resolveProductListQuery — 조건이 섞여 있을 때", () => {
  it("유효한 것은 통과시키고 무효한 것만 되돌린다", () => {
    expect(resolveProductListQuery({ q: "코트", category: "home", sort: "x", page: "0" })).toEqual({
      q: "코트",
      category: "home",
      sort: "latest",
      page: 1,
    });
  });
});
