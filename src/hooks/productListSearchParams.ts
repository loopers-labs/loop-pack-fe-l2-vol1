// 서버·클라 공용이라 parser 는 nuqs/server 에서 가져온다
import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server";
import { PRODUCT_LIST_DEFAULTS } from "@/utils/productList";
import {
  CATEGORY_VALUES,
  SORT_VALUES,
} from "@/components/commerce/productListOptions";
import type { ProductListParams } from "@/queries/products";

export const FIRST_PAGE = 1;

export const productListParsers = {
  q: parseAsString.withDefault(PRODUCT_LIST_DEFAULTS.q),
  category: parseAsStringLiteral(CATEGORY_VALUES).withDefault(
    PRODUCT_LIST_DEFAULTS.category,
  ),
  sort: parseAsStringLiteral(SORT_VALUES).withDefault(
    PRODUCT_LIST_DEFAULTS.sort,
  ),
  page: parseAsInteger.withDefault(PRODUCT_LIST_DEFAULTS.page),
};

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
