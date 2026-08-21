import { describe, expect, it } from "vitest";
import type { ProductListResponse } from "@/types/commerce";
import { buildDescription, buildTitle } from "./metadata";
import type { ProductSearchState } from "./search-params";

const searchState = (overrides: Partial<ProductSearchState> = {}): ProductSearchState => ({
  q: "",
  scenario: null,
  category: "all",
  sort: "latest",
  page: 1,
  pageSize: 12,
  ...overrides,
});

const listResponse = (overrides: Partial<ProductListResponse> = {}): ProductListResponse => ({
  products: [],
  categories: [{ id: "casual", name: "캐주얼" }],
  totalCount: 3,
  page: 1,
  pageSize: 12,
  ...overrides,
});

describe("buildTitle", () => {
  it("검색어가 없으면 1페이지 제목은 '상품 목록'이다", () => {
    expect(buildTitle(searchState())).toBe("상품 목록");
  });

  it("공백뿐인 검색어는 빈 검색어로 취급된다", () => {
    expect(buildTitle(searchState({ q: "   " }))).toBe("상품 목록");
  });

  it("검색어의 앞뒤 공백을 지우고 따옴표로 감싼 검색 결과 제목을 만든다", () => {
    expect(buildTitle(searchState({ q: " 셔츠 " }))).toBe('"셔츠" 검색 결과');
  });

  it("2페이지부터는 제목 뒤에 페이지 번호가 붙는다", () => {
    expect(buildTitle(searchState({ page: 2 }))).toBe("상품 목록 2페이지");
    expect(buildTitle(searchState({ q: "셔츠", page: 3 }))).toBe('"셔츠" 검색 결과 3페이지');
  });
});

describe("buildDescription", () => {
  it("카테고리 id를 응답이 알려준 카테고리 이름으로 풀어 쓴다", () => {
    expect(buildDescription(searchState({ category: "casual" }), listResponse())).toBe(
      "캐주얼 카테고리 상품 3개를 최신순으로 만나보세요.",
    );
  });

  it("전체 카테고리는 '전체'로 표기한다", () => {
    expect(buildDescription(searchState(), listResponse())).toBe(
      "전체 카테고리 상품 3개를 최신순으로 만나보세요.",
    );
  });

  it("응답에 없는 카테고리 id는 id 그대로 노출한다", () => {
    expect(
      buildDescription(searchState({ category: "casual" }), listResponse({ categories: [] })),
    ).toBe("casual 카테고리 상품 3개를 최신순으로 만나보세요.");
  });

  it("정렬 조건을 사람이 읽는 라벨로 바꿔 쓴다", () => {
    expect(buildDescription(searchState({ sort: "price-desc" }), listResponse())).toBe(
      "전체 카테고리 상품 3개를 높은 가격순으로 만나보세요.",
    );
  });

  it("결과가 0개면 다른 조건을 안내하는 문구를 만든다", () => {
    expect(
      buildDescription(searchState({ category: "casual" }), listResponse({ totalCount: 0 })),
    ).toBe("캐주얼 카테고리(최신순) 조건에 맞는 상품이 0개입니다. 다른 조건으로 검색해 보세요.");
  });
});
