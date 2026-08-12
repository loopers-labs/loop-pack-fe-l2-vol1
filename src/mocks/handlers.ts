import { http, HttpResponse } from "msw";
import { categories, products } from "@/app/api/_data/commerce";
import type { ProductListResponse } from "@/entities/product";

// 경로만 보고 가로챈다 — jsdom origin 설정이 바뀌어도 핸들러가 따라 흔들리지 않는다.
export const PRODUCTS_ENDPOINT = "*/api/products";

export const PAGE_SIZE = 12;

// 픽스처는 mock 백엔드가 쓰는 실제 상품 데이터를 그대로 쓴다.
// 별도 더미를 만들면 응답 계약이 조용히 갈라진다.
export function productListResponse(
  overrides: Partial<ProductListResponse> = {},
): ProductListResponse {
  return {
    products: products.slice(0, PAGE_SIZE),
    categories,
    totalCount: products.length,
    page: 1,
    pageSize: PAGE_SIZE,
    ...overrides,
  };
}

// 기본 핸들러는 성공 경로만 둔다.
// 실패·지연·빈 결과는 그것을 검증하는 테스트가 server.use()로 그 자리에서 덮는다 —
// 기본값에 예외를 섞어두면 어떤 테스트가 무엇을 전제했는지 파일을 떠나야 알 수 있다.
export const handlers = [
  http.get(PRODUCTS_ENDPOINT, () => HttpResponse.json(productListResponse())),
];
