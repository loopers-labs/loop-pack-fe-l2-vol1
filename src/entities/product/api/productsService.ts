import type { ProductListQuery, ProductListResponse } from '../model/product';
import { apiResponseResult } from '@/shared/api/response';

const DEFAULT_PAGE_SIZE = 12;

function buildProductListParams(query: ProductListQuery): URLSearchParams {
  const params = new URLSearchParams();

  if (query.q) params.set('q', query.q);
  if (query.category && query.category !== 'all') params.set('category', query.category);
  params.set('sort', query.sort ?? 'latest');
  params.set('page', String(query.page ?? 1));
  params.set('pageSize', String(query.pageSize ?? DEFAULT_PAGE_SIZE));

  return params;
}

/* AI-generated : Week 7 Part 2 — signal을 받아 apiResponseResult로 전달(AbortSignal 연결) */
export async function fetchProductList(
  query: ProductListQuery,
  signal?: AbortSignal,
): Promise<ProductListResponse> {
  const params = buildProductListParams(query);
  return apiResponseResult(`/api/products?${params.toString()}`, signal);
}
