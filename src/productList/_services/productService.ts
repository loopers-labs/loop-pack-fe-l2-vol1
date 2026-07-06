import type { ProductListResponse } from '../types';

type FetchProductsParams = {
  category: string;
  minPrice: number | '';
  maxPrice: number | '';
  sortBy: string;
  searchQuery: string;
  page: number;
  pageSize: number;
};

export async function fetchProducts({
  category,
  minPrice,
  maxPrice,
  sortBy,
  searchQuery,
  page,
  pageSize,
}: FetchProductsParams): Promise<ProductListResponse> {
  const params = new URLSearchParams({
    category,
    sort: sortBy,
    q: searchQuery,
    page: String(page),
    size: String(pageSize),
  });
  if (minPrice !== '') params.set('minPrice', String(minPrice));
  if (maxPrice !== '') params.set('maxPrice', String(maxPrice));

  const res = await fetch(`/api/products?${params.toString()}`);
  if (!res.ok) throw new Error(`API 호출 실패 (status: ${res.status})`);
  return res.json() as Promise<ProductListResponse>;
}
