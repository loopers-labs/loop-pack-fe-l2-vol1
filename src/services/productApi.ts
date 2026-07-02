import type { Product, ProductListResponse, SortBy } from '../types/product';

export const PAGE_SIZE = 12;

export type ProductListParams = {
  category: 'all' | Product['category'];
  minPrice: number | '';
  maxPrice: number | '';
  sortBy: SortBy;
  searchQuery: string;
  page: number;
  inStockOnly: boolean;
};

function isProductListResponse(value: unknown): value is ProductListResponse {
  if (typeof value !== 'object' || value === null) return false;
  if (!('products' in value) || !Array.isArray(value.products)) return false;
  if (!('totalCount' in value) || typeof value.totalCount !== 'number') {
    return false;
  }
  return true;
}

export async function getProducts(
  params: ProductListParams,
): Promise<ProductListResponse> {
  const search = new URLSearchParams({
    category: params.category,
    sort: params.sortBy,
    q: params.searchQuery,
    page: String(params.page),
    size: String(PAGE_SIZE),
  });
  if (params.minPrice !== '') search.set('minPrice', String(params.minPrice));
  if (params.maxPrice !== '') search.set('maxPrice', String(params.maxPrice));
  if (params.inStockOnly) search.set('inStock', 'true');

  const res = await fetch(`/api/products?${search.toString()}`);
  if (!res.ok) throw new Error(`API 호출 실패 (status: ${res.status})`);

  const data: unknown = await res.json();
  if (!isProductListResponse(data)) {
    throw new Error('상품 목록 응답 형식이 올바르지 않습니다.');
  }
  return data;
}
