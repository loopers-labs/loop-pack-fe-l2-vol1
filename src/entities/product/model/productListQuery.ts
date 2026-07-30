import type { ProductListQuery } from "@/types/commerce";

export const PRODUCT_LIST_DEFAULTS = {
  q: "",
  category: "all",
  sort: "latest",
  page: 1,
  pageSize: 12,
} as const;

export const FIRST_PAGE = 1;

// 과제 기본 제공 타입에서 Pick으로 필요한 필드만 뽑아 필수화한 타입 정의.
// pageSize는 fetcher가 채우므로 여기 포함하지 않는다.
export type ProductListParams = Required<
  Pick<ProductListQuery, "q" | "category" | "sort" | "page">
>;

/**
 * 부분 조건에 기본값을 채워 정규화한다.
 * queryKey와 API 요청 양쪽에 이 결과를 써서, 같은 요청이 다른 키로 캐시 중복되는 것을 막는다.
 * (예: {sort,page} 와 {sort,page,pageSize:12} 는 같은 요청이지만 정규화 전에는 다른 키)
 */
export function normalizeProductListQuery(
  query: ProductListQuery,
): Required<ProductListQuery> {
  return {
    q: query.q?.trim() ?? PRODUCT_LIST_DEFAULTS.q,
    category: query.category ?? PRODUCT_LIST_DEFAULTS.category,
    sort: query.sort ?? PRODUCT_LIST_DEFAULTS.sort,
    page: query.page ?? PRODUCT_LIST_DEFAULTS.page,
    pageSize: query.pageSize ?? PRODUCT_LIST_DEFAULTS.pageSize,
  };
}

export function buildProductListSearchParams(
  query: ProductListQuery,
): URLSearchParams {
  const params = new URLSearchParams();
  const q = query.q?.trim();
  const category = query.category ?? PRODUCT_LIST_DEFAULTS.category;

  if (q) params.set("q", q);

  // category=all 은 필터 없음과 같으므로 요청에서 생략한다
  if (category !== "all") params.set("category", category);
  params.set("sort", query.sort ?? PRODUCT_LIST_DEFAULTS.sort);
  params.set("page", String(query.page ?? PRODUCT_LIST_DEFAULTS.page));
  params.set(
    "pageSize",
    String(query.pageSize ?? PRODUCT_LIST_DEFAULTS.pageSize),
  );

  return params;
}

// page 하한 규칙: FIRST_PAGE 미만이면 FIRST_PAGE 로 올리고, FIRST_PAGE 이상이면 그대로
export function clampPageToLowerBound(page: number): number {
  return Math.max(FIRST_PAGE, page);
}

export function resolveProductListQuery(
  parsed: ProductListParams,
): ProductListParams {
  return { ...parsed, page: clampPageToLowerBound(parsed.page) };
}

// 홈에서 목록으로 이동하기 전 prefetch 시, 하드코딩 대신 이 단일 출처를 써서
// 목록 페이지의 resolveProductListQuery(파서 파싱값)와 같은 queryKey 보장
export function buildDefaultProductListQuery(
  overrides: Partial<ProductListParams>,
): ProductListParams {
  return resolveProductListQuery({
    q: PRODUCT_LIST_DEFAULTS.q,
    category: PRODUCT_LIST_DEFAULTS.category,
    sort: PRODUCT_LIST_DEFAULTS.sort,
    page: PRODUCT_LIST_DEFAULTS.page,
    ...overrides,
  });
}
