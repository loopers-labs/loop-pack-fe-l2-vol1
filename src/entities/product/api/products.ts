import type { ProductListQuery, ProductListResponse } from '@/entities/product/model';
import type { MockApiScenario } from '@/shared/api';
// eslint-disable-next-line boundaries/element-types -- mock data-access 임시 예외: entities/server 영역으로 옮기고 server-only 경계 명시 후 제거
import { getProductsData, waitForMockApi } from '@/app/api/_data/commerce';

export async function getProducts(
  query: ProductListQuery & { scenario?: MockApiScenario | null },
): Promise<ProductListResponse> {
  const params = new URLSearchParams();
  if (query.q) params.set('q', query.q);
  if (query.category) params.set('category', query.category);
  if (query.sort) params.set('sort', query.sort);
  if (query.page) params.set('page', String(query.page));
  if (query.scenario) params.set('scenario', query.scenario);

  const result = await fetch(`/api/products?${params.toString()}`);
  if (!result.ok) throw new Error('API 호출 실패');
  return result.json() as Promise<ProductListResponse>;
}

export async function getProductsServerData(
  query: ProductListQuery & { scenario?: MockApiScenario | null },
): Promise<ProductListResponse> {
  if (process.env.SIMULATE_METADATA_FAILURE === 'true') {
    throw new Error('상품 목록 조회 실패 (시뮬레이션)');
  }
  if (query.scenario === 'error') {
    throw new Error('상품 목록을 불러오지 못했습니다.');
  }
  if (query.scenario === 'slow') {
    await waitForMockApi(1_500);
  }
  return getProductsData(query);
}