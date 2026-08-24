import { describe, expect, test } from "vitest";
import { productQueries } from "../api/productQueries";
import {
  buildDefaultProductListQuery,
  buildProductListSearchParams,
  clampPageToLowerBound,
  normalizeProductListQuery,
  PRODUCT_LIST_DEFAULTS,
  resolveProductListQuery,
  type ProductListParams,
} from "./productListQuery";

const BASE: ProductListParams = {
  q: "",
  category: "all",
  sort: "latest",
  page: 1,
};

describe("week8 검증대상 2 — normalizeProductListQuery — 부분 조건에 기본값을 채워 정규화", () => {
  test("빈 조건은 기본값으로 전부 채운다", () => {
    expect(normalizeProductListQuery({})).toEqual(PRODUCT_LIST_DEFAULTS);
  });

  test("경계: 검색어 앞뒤 공백을 잘라내고, 공백뿐이면 빈 검색어로 접는다", () => {
    expect(normalizeProductListQuery({ q: "  셔츠  " }).q).toBe("셔츠");
    expect(normalizeProductListQuery({ q: "   " }).q).toBe("");
  });
});

describe("week8 검증대상 2 — query key 계약 — 같은 조건은 같은 key, 다른 조건은 다른 key", () => {
  test("공백만 다른 검색어는 같은 조건으로 접혀 같은 key 가 된다(정규화가 trim)", () => {
    const padded = productQueries.list({ ...BASE, q: "  " });
    const empty = productQueries.list({ ...BASE, q: "" });

    expect(padded.queryKey).toEqual(empty.queryKey);
  });

  test("page 만 달라도 다른 key 가 된다", () => {
    const page1 = productQueries.list({ ...BASE, page: 1 });
    const page2 = productQueries.list({ ...BASE, page: 2 });

    expect(page1.queryKey).not.toEqual(page2.queryKey);
  });
});

describe("week8 검증대상 3-1 — buildProductListSearchParams — 조건을 서버 요청 파라미터로 조립", () => {
  test("검색어·카테고리 없으면 sort·page·pageSize 기본값만 싣는다", () => {
    const params = buildProductListSearchParams({});

    expect(params.get("q")).toBeNull();
    expect(params.get("category")).toBeNull();
    expect(params.get("sort")).toBe(PRODUCT_LIST_DEFAULTS.sort);
    expect(params.get("page")).toBe(String(PRODUCT_LIST_DEFAULTS.page));
    expect(params.get("pageSize")).toBe(String(PRODUCT_LIST_DEFAULTS.pageSize));
  });

  test("경계: 검색어는 trim 해서 싣고, 공백뿐이면 아예 뺀다", () => {
    expect(buildProductListSearchParams({ q: "  셔츠  " }).get("q")).toBe(
      "셔츠",
    );
    expect(buildProductListSearchParams({ q: "   " }).get("q")).toBeNull();
  });

  test("경계: category=all 은 필터 없음이라 요청에서 생략한다", () => {
    expect(
      buildProductListSearchParams({ category: "all" }).get("category"),
    ).toBeNull();
    expect(
      buildProductListSearchParams({ category: "home" }).get("category"),
    ).toBe("home");
  });
});

describe("week8 검증대상 3-2 — clampPageToLowerBound — page 하한을 1로 올린다", () => {
  test("경계: 1 미만은 1로 끌어올린다", () => {
    expect(clampPageToLowerBound(0)).toBe(1);
    expect(clampPageToLowerBound(-5)).toBe(1);
  });

  test("1 이상은 그대로 둔다", () => {
    expect(clampPageToLowerBound(1)).toBe(1);
    expect(clampPageToLowerBound(3)).toBe(3);
  });
});

// 항목 외 — 같은 모듈의 기존 순수 함수 테스트.
// resolveProductListQuery 는 clampPageToLowerBound 를 page 에 적용한 래퍼,
// buildDefaultProductListQuery 는 홈→목록 prefetch 조건 조립(15개 항목에는 없음).
describe("resolveProductListQuery — URL 파싱값을 상품 목록 조회 조건(queryKey 재료)으로 변환", () => {
  test("page 하한(<1)을 1로 클램프한다", () => {
    expect(resolveProductListQuery({ ...BASE, page: 0 }).page).toBe(1);
    expect(resolveProductListQuery({ ...BASE, page: -5 }).page).toBe(1);
  });

  test("유효한 page 는 그대로 둔다", () => {
    expect(resolveProductListQuery({ ...BASE, page: 3 }).page).toBe(3);
  });

  test("q·category·sort 는 그대로 통과시킨다", () => {
    const resolved = resolveProductListQuery({
      q: "stanley",
      category: "home",
      sort: "price-asc",
      page: 2,
    });

    expect(resolved).toEqual({
      q: "stanley",
      category: "home",
      sort: "price-asc",
      page: 2,
    });
  });
});

describe("buildDefaultProductListQuery — 파서 default(PRODUCT_LIST_DEFAULTS)에서 파생한 조회 조건", () => {
  test("override 없으면 파서 default와 같은 조건을 만든다", () => {
    expect(buildDefaultProductListQuery({})).toEqual({
      q: PRODUCT_LIST_DEFAULTS.q,
      category: PRODUCT_LIST_DEFAULTS.category,
      sort: PRODUCT_LIST_DEFAULTS.sort,
      page: PRODUCT_LIST_DEFAULTS.page,
    });
  });

  test("category override 는 default 위에 덮어쓴다", () => {
    expect(buildDefaultProductListQuery({ category: "home" })).toEqual({
      q: PRODUCT_LIST_DEFAULTS.q,
      category: "home",
      sort: PRODUCT_LIST_DEFAULTS.sort,
      page: PRODUCT_LIST_DEFAULTS.page,
    });
  });
});
