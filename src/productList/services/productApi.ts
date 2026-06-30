import type { CategoryFilter, Product, SortBy } from '../types';

export type FetchProductsParams = {
  category: CategoryFilter;
  sortBy: SortBy;
  searchQuery: string;
  page: number;
  size: number;
  minPrice: number | '';
  maxPrice: number | '';
};

export type ProductListResponse = {
  products: Product[];
  totalCount: number;
};

export async function fetchProducts(
  params: FetchProductsParams,
): Promise<ProductListResponse> {
  const searchParams = new URLSearchParams({
    category: params.category,
    sort: params.sortBy,
    q: params.searchQuery,
    page: String(params.page),
    size: String(params.size),
  });

  if (params.minPrice !== '')
    searchParams.set('minPrice', String(params.minPrice));
  if (params.maxPrice !== '')
    searchParams.set('maxPrice', String(params.maxPrice));

  const res = await fetch(`/api/products?${searchParams.toString()}`);

  if (!res.ok) throw new Error(`API 호출 실패 (status: ${res.status})`);

  return res.json();
}
