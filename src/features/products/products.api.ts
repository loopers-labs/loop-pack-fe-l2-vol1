import type { ProductListQuery, ProductListResponse } from '@/types/commerce';

function isProductListResponse(data: unknown): data is ProductListResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    'products' in data &&
    Array.isArray(data.products) &&
    'totalCount' in data &&
    typeof data.totalCount === 'number'
  );
}

export async function getProducts(
  query: ProductListQuery = {},
): Promise<ProductListResponse> {
  const params = new URLSearchParams();
  if (query.q) params.set('q', query.q);
  if (query.category) params.set('category', query.category);
  if (query.sort) params.set('sort', query.sort);
  if (query.page) params.set('page', String(query.page));
  if (query.pageSize) params.set('pageSize', String(query.pageSize));

  const res = await fetch(`/api/products?${params.toString()}`);
  if (!res.ok) throw new Error('상품 목록을 불러오지 못했습니다.');

  const data: unknown = await res.json();
  if (!isProductListResponse(data)) {
    throw new Error('상품 목록 응답 형식이 올바르지 않습니다.');
  }
  return data;
}
