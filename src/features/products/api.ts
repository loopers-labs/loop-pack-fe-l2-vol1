import type {
  HomeResponse,
  ProductListQuery,
  ProductListResponse,
} from '@/entities/product';
import { apiClient } from '@/shared/api-client';

export function getHome() {
  return apiClient<HomeResponse>('/api/home');
}

export function getProducts(conditions: Required<ProductListQuery>) {
  const params = new URLSearchParams({
    ...(conditions.q ? { q: conditions.q } : {}),
    category: conditions.category,
    sort: conditions.sort,
    page: String(conditions.page),
    pageSize: String(conditions.pageSize),
  });

  return apiClient<ProductListResponse>(`/api/products?${params}`);
}
