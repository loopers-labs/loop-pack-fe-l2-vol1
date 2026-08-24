import { http, HttpResponse } from "msw";
import type { ProductListResponse } from "@/entities/product/api/fetchProducts";

export const PRODUCTS_ENDPOINT = "/api/products";

const EMPTY_PRODUCT_LIST: ProductListResponse = {
  products: [],
  categories: [],
  totalCount: 0,
  page: 1,
  pageSize: 12,
};

// 기본 핸들러는 성공 경로만 둔다. 실패·지연·빈 결과·특정 데이터는 각 테스트가 server.use()로 덮는다.
export const handlers = [
  http.get(PRODUCTS_ENDPOINT, () => HttpResponse.json(EMPTY_PRODUCT_LIST)),
];
