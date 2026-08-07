import type { ProductListQuery, ProductListResponse } from '@/entities/product/model';
// eslint-disable-next-line boundaries/element-types -- app-data(mock 백엔드)는 서버 전용 함수라 여러 레이어에서 직접 참조 가능해야 함
import { getProductsData } from '@/app/api/_data/commerce';

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

export function getProductsServerData(
  query: ProductListQuery,
): Promise<ProductListResponse> {
  if (process.env.SIMULATE_METADATA_FAILURE === 'true') {
    return Promise.reject(new Error('상품 목록 조회 실패 (시뮬레이션)'));
  }
  return Promise.resolve(getProductsData(query));
}