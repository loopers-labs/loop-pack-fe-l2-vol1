import { apiFetch } from '@/shared/api/apiFetch';
import type { Product, ProductListResponse } from '../model/types';

// /api/products가 허용하는 pageSize 상한(app/api/products/route.ts). 상품이 30개라 한 번에 다 받을 수 없다.
const CATALOG_PAGE_SIZE = 24;

const fetchPage = (page: number, signal?: AbortSignal) => apiFetch<ProductListResponse>(`/api/products?page=${page}&pageSize=${CATALOG_PAGE_SIZE}`, { signal });

/**
 * 주문 API는 productId와 수량만 돌려준다(과제 문서 39번 줄). 주문 화면에서 상품명·가격·이미지를
 * 보이려면 상품 데이터를 직접 붙여야 해서, 전체 카탈로그를 id로 찾을 수 있는 표로 만든다.
 *
 * 단건 조회 엔드포인트가 없어 항목마다 조회하는 방식은 애초에 불가능하다. 대신 요청 수가
 * 주문 항목 수와 무관하게 전체 페이지 수로만 결정된다(현재 상품 30개 → 2회).
 * 페이지 수는 응답의 totalCount로 계산한다 — 상품이 늘어도 코드를 고치지 않는다.
 */
export async function getProductCatalog(signal?: AbortSignal): Promise<Record<string, Product>> {
  const firstPage = await fetchPage(1, signal);
  const remainingPageCount = Math.ceil(firstPage.totalCount / firstPage.pageSize) - 1;

  const remainingPages = await Promise.all(Array.from({ length: Math.max(remainingPageCount, 0) }, (_, index) => fetchPage(index + 2, signal)));

  return Object.fromEntries([firstPage, ...remainingPages].flatMap((page) => page.products).map((product) => [product.id, product]));
}
