import type { ProductListQuery, ProductListResponse } from '@/entities/product/model';

export async function getProducts(
  query: ProductListQuery,
): Promise<ProductListResponse> {
  const params = new URLSearchParams();
  if (query.q) params.set('q', query.q);
  if (query.category) params.set('category', query.category);
  if (query.sort) params.set('sort', query.sort);
  if (query.page) params.set('page', String(query.page));

  const result = await fetch(`/api/products?${params.toString()}`);
  if (!result.ok) throw new Error('API 호출 실패');
  return result.json() as Promise<ProductListResponse>;
}
