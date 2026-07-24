import { queryOptions } from '@tanstack/react-query';
import type {
  Product,
  ProductListQuery,
  ProductListResponse,
} from '@/types/commerce';

export function productListQueryOptions(params: ProductListQuery) {
  const { q, category, sort = 'latest', page = 1, pageSize = 12 } = params;

  return queryOptions({
    queryKey: ['products', { q, category, sort, page, pageSize }],
    queryFn: async (): Promise<ProductListResponse> => {
      const searchParams = new URLSearchParams();
      if (q) searchParams.set('q', q);
      if (category && category !== 'all') searchParams.set('category', category);
      searchParams.set('sort', sort);
      searchParams.set('page', String(page));
      searchParams.set('pageSize', String(pageSize));

      const response = await fetch(`/api/products?${searchParams}`);
      if (!response.ok) throw new Error('상품 목록을 불러오지 못했습니다.');
      return response.json();
    },
    staleTime: 0,
  });
}

export function productDetailQueryOptions(id: string) {
  return queryOptions({
    queryKey: ['products', 'detail', id],
    queryFn: async (): Promise<Product> => {
      const response = await fetch(`/api/products?id=${id}`);
      if (!response.ok) throw new Error('상품을 찾을 수 없습니다.');
      const data: ProductListResponse = await response.json();
      return data.products[0];
    },
    staleTime: 0,
    gcTime: 10 * 60 * 1000,
  });
}
