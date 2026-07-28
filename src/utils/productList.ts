import type { ProductListQuery } from "@/types/commerce";

export const PRODUCT_LIST_DEFAULTS = {
  q: "",
  category: "all",
  sort: "latest",
  page: 1,
  pageSize: 12,
} as const;

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
