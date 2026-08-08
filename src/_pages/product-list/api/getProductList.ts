// AI 생성
import { apiFetch } from '@/shared/api/apiFetch';
import type { ProductListQuery, ProductListResponse } from '@/entities/product';

function toSearchParams(query: ProductListQuery): string {
  const params = new URLSearchParams();
  if (query.q) params.set('q', query.q);
  if (query.category) params.set('category', query.category);
  if (query.sort) params.set('sort', query.sort);
  if (query.page) params.set('page', String(query.page));
  if (query.pageSize) params.set('pageSize', String(query.pageSize));
  return params.toString();
}

// AI 생성: week-07 3단계 — metadata의 query failure(APP_ORIGIN 불능) 재현을 위해 서버도
// Route Handler를 절대 URL로 호출한다(week-05 direct-call 우회 폐기, docs/work/week-07/measurement-and-decisions.md 참고).
// query는 toProductListQuery에서 정규화(q trim/소문자, page clamp)를 거친 값이다.
export async function getProductList(query: ProductListQuery, signal?: AbortSignal): Promise<ProductListResponse> {
  return apiFetch(`/api/products?${toSearchParams(query)}&scenario=slow`, { signal });
}
