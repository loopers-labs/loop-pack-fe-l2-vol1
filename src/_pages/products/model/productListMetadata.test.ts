// buildProductListTitle — 문서 제목 조립 순수 함수.
// 검색어·카테고리·페이지·빈결과 4갈래를 조합한다. 서버 generateMetadata 와 클라이언트
// document.title 이 같은 규칙을 쓰도록 분리된 함수라, 규칙이 어긋나면 탭 제목·OG 카드가 결과와 달라진다.
import { describe, expect, test } from "vitest";
import type { ProductListParams } from "@/entities/product";
import { buildProductListTitle } from "./productListMetadata";

const BASE: ProductListParams = {
  q: "",
  category: "all",
  sort: "latest",
  page: 1,
};

const NOT_EMPTY = false;
const EMPTY = true;

describe("week8 검증대상 3-3 — buildProductListTitle — 조건 조합으로 문서 제목을 만든다", () => {
  test("검색어와 카테고리가 함께 있으면 '검색 결과 · 카테고리명'", () => {
    expect(
      buildProductListTitle(
        { ...BASE, q: "셔츠", category: "fashion" },
        NOT_EMPTY,
      ),
    ).toBe('"셔츠" 검색 결과 · 패션');
  });

  test("검색어만 있으면 '검색 결과'만", () => {
    expect(buildProductListTitle({ ...BASE, q: "셔츠" }, NOT_EMPTY)).toBe(
      '"셔츠" 검색 결과',
    );
  });

  test("카테고리만 있으면 카테고리명", () => {
    expect(
      buildProductListTitle({ ...BASE, category: "fashion" }, NOT_EMPTY),
    ).toBe("패션");
  });

  test("검색어도 카테고리도 없으면(전체) '상품 목록'", () => {
    expect(buildProductListTitle(BASE, NOT_EMPTY)).toBe("상품 목록");
  });

  test("경계: 2페이지 이상이면 '— N페이지'를 붙이고, 1페이지엔 붙이지 않는다", () => {
    expect(buildProductListTitle({ ...BASE, page: 1 }, NOT_EMPTY)).toBe(
      "상품 목록",
    );
    expect(buildProductListTitle({ ...BASE, page: 2 }, NOT_EMPTY)).toBe(
      "상품 목록 — 2페이지",
    );
  });

  test("경계: 결과가 0개면 '(0개)'를 붙인다", () => {
    expect(buildProductListTitle(BASE, EMPTY)).toBe("상품 목록 (0개)");
  });

  test("경계: 검색어·2페이지·0개가 겹치면 순서대로 모두 붙는다", () => {
    expect(buildProductListTitle({ ...BASE, q: "셔츠", page: 2 }, EMPTY)).toBe(
      '"셔츠" 검색 결과 — 2페이지 (0개)',
    );
  });
});
