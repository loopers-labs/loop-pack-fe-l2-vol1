import type { Metadata } from "next";
import { baseOpenGraph } from "@/shared/config";
import {
  CATEGORY_LABELS,
  SORT_LABELS,
  type ProductListParams,
  type ProductListResponse,
} from "@/entities/product";

const ALL_CATEGORY_LABEL = "전체";

function resolveCategoryLabel(
  query: ProductListParams,
  categories: ProductListResponse["categories"],
): string {
  if (query.category === "all") return ALL_CATEGORY_LABEL;

  return (
    categories.find((category) => category.id === query.category)?.name ??
    query.category
  );
}

// title 의 base: 검색어를 먼저, 그 뒤에 카테고리명을 함께 보여준다(검색어가 카테고리를 덮지 않게).
//  - 검색어+카테고리 → `"셔츠" 검색 결과 · 패션`
//  - 검색어만        → `"셔츠" 검색 결과`
//  - 카테고리만      → `패션`
//  - 둘 다 없음(전체) → `상품 목록`
function resolveProductListTitleBase(query: ProductListParams): string {
  const categoryLabel =
    query.category === "all" ? null : CATEGORY_LABELS[query.category];

  if (query.q) {
    const searchLabel = `"${query.q}" 검색 결과`;

    return categoryLabel ? `${searchLabel} · ${categoryLabel}` : searchLabel;
  }

  return categoryLabel ?? "상품 목록";
}

// 위 base 에 2페이지 이상이면 페이지 번호를, 결과가 0개면 "(0개)"를 붙인 문서 제목의 `%s`
// (루트 template "%s | Commerce" 자리) 부분 — 검색/필터 결과 없음을 title 에도 드러낸다.
// 서버 generateMetadata 와 클라이언트 document.title 동기화가 같은 규칙을 쓰도록 순수 함수로 분리한다.
export function buildProductListTitle(
  query: ProductListParams,
  isEmpty: boolean,
): string {
  const base = resolveProductListTitleBase(query);
  const withPage = query.page > 1 ? `${base} — ${query.page}페이지` : base;

  return isEmpty ? `${withPage} (0개)` : withPage;
}

// URL 조건 + 조회 결과로 목록 metadata 를 만든다.
// title 은 검색어(없으면 카테고리명), description 은 category·sort·총 개수, 2페이지 이상은 title 에 페이지 번호를.
// 결과 0건도 총 개수를 description 에 그대로 실어 "0개임"이 드러나고, 첫 상품이 없으면 OG fallback 이미지를 유지한다.
export function buildProductListMetadata(
  query: ProductListParams,
  result: ProductListResponse,
): Metadata {
  const title = buildProductListTitle(query, result.totalCount === 0);

  const categoryLabel = resolveCategoryLabel(query, result.categories);
  const description = `${categoryLabel} · ${SORT_LABELS[query.sort]} · 총 ${result.totalCount}개`;

  const firstProduct = result.products[0];
  const images = firstProduct
    ? [{ url: firstProduct.image }]
    : baseOpenGraph.images;

  return {
    title,
    description,
    openGraph: { ...baseOpenGraph, title, description, images },
  };
}
