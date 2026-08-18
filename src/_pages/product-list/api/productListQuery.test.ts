import { describe, expect, it } from "vitest";
import type { ResolvedProductListQuery } from "../model/useProductListQuery";
import { productListQueryOptions } from "./productListQuery";

// 2번 항목 — URL 조건 → query key.
// 지키려는 것은 "요청이 나갔다"가 아니라 **캐시 동일성**이다:
//   같은 조건은 같은 key, 다른 조건은 다른 key.
// 요청 URL에 조건이 실리는지는 통합(8·9·10·11)의 MSW 핸들러가 요청을 읽어 확인한다 —
// 여기서 queryFn을 부르면 네트워크 경계를 단위 테스트로 끌어오게 된다.

const BASE: ResolvedProductListQuery = { q: "", category: "all", sort: "latest", page: 1 };
const keyOf = (query: ResolvedProductListQuery) => productListQueryOptions(query).queryKey;

describe("queryKey — 같은 조건", () => {
  it("따로 만든 같은 조건은 같은 key를 만든다", () => {
    // 같은 조건으로 재방문·앞뒤 이동했을 때 캐시가 즉시 응답하는 근거다.
    // 이게 깨지면 조건이 같아도 매번 재요청한다.
    expect(keyOf({ ...BASE })).toEqual(keyOf({ ...BASE }));
  });

  it("속성을 적는 순서가 달라도 같은 key를 만든다", () => {
    const reordered: ResolvedProductListQuery = {
      page: 1,
      sort: "latest",
      category: "all",
      q: "",
    };
    expect(keyOf(reordered)).toEqual(keyOf(BASE));
  });
});

describe("queryKey — 다른 조건", () => {
  // 이쪽이 더 위험하다. 다른 조건이 같은 key를 만들면
  // 카테고리를 바꿨는데 이전 목록이 그대로 보인다.
  // 타입을 명시해 리터럴이 string으로 넓어지지 않게 한다(as 없이).
  const oneFieldChanged: Array<[string, Partial<ResolvedProductListQuery>]> = [
    ["검색어", { q: "코트" }],
    ["카테고리", { category: "fashion" }],
    ["정렬", { sort: "price-asc" }],
    ["페이지", { page: 2 }],
  ];

  it.each(oneFieldChanged)("%s가 다르면 다른 key를 만든다", (_label, patch) => {
    expect(keyOf({ ...BASE, ...patch })).not.toEqual(keyOf(BASE));
  });

  it("조건이 두 개 달라도 서로 구분된다", () => {
    const a = keyOf({ ...BASE, category: "fashion", page: 2 });
    const b = keyOf({ ...BASE, category: "home", page: 2 });
    expect(a).not.toEqual(b);
  });

  it("검색어의 빈 문자열과 공백은 다른 조건으로 본다", () => {
    // 공백을 트림하는 책임은 SearchForm(제출 시)에 있다.
    // 여기까지 온 값은 이미 확정된 조건이므로 그대로 구분한다.
    expect(keyOf({ ...BASE, q: " " })).not.toEqual(keyOf({ ...BASE, q: "" }));
  });
});

describe("queryKey — 모양", () => {
  it('["products", 조건] 형태다', () => {
    // ⚠️ 이 모양이 바뀌면 캐시 동일성이 깨진다(7주차 기준선 #8).
    // 계약이라고 선언한 값이므로 바꿀 때 이 테스트가 함께 깨지는 것이 경고로 작동한다.
    expect(keyOf(BASE)).toEqual(["products", BASE]);
  });

  it("조건 객체 전체가 key에 담긴다", () => {
    const query: ResolvedProductListQuery = {
      q: "코트",
      category: "fashion",
      sort: "price-desc",
      page: 3,
    };
    expect(keyOf(query)[1]).toEqual(query);
  });
});
