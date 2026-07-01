import type { CategoryFilter, Product, SortBy } from '../types';

export type FetchProductsParams = {
  category: CategoryFilter;
  sortBy: SortBy;
  searchQuery: string;
  page: number;
  size: number;
  minPrice: number | null;
  maxPrice: number | null;
  inStockOnly: boolean;
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

  if (params.minPrice !== null)
    searchParams.set('minPrice', String(params.minPrice));
  if (params.maxPrice !== null)
    searchParams.set('maxPrice', String(params.maxPrice));
  if (params.inStockOnly) searchParams.set('inStock', 'true');

  const res = await fetch(`/api/products?${searchParams.toString()}`);

  if (!res.ok) throw new Error(`API 호출 실패 (status: ${res.status})`);

  return res.json();
}
