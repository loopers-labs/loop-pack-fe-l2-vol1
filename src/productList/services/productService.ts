import type { ProductListResponse, ProductListParams } from '../type';
import { PAGE_SIZE } from '../hooks/useProductFilter';

export async function fetchProducts(
  params: ProductListParams,
): Promise<ProductListResponse> {
  const query = new URLSearchParams({
    category: params.category,
    sort: params.sortBy,
    q: params.searchQuery,
    page: String(params.page),
    size: String(PAGE_SIZE),
  });
  if (params.minPrice !== '') query.set('minPrice', String(params.minPrice));
  if (params.maxPrice !== '') query.set('maxPrice', String(params.maxPrice));
  if (params.inStockOnly) query.set('inStock', 'true');

  const res = await fetch(`/api/products?${query.toString()}`);
  if (!res.ok) throw new Error(`API 호출 실패 (status: ${res.status})`);
  return res.json() as Promise<ProductListResponse>;
}
