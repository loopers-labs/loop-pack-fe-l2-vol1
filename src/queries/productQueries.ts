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
    // 목록은 필터 조건마다 캐시가 다름, 같은 조건 재방문 시 30초간 재요청 안 함
    staleTime: 30 * 1000,
  });
}

export function productDetailQueryOptions(id: string) {
  return queryOptions({
    queryKey: ['products', 'detail', id],
    queryFn: async (): Promise<Product> => {
      // 상세 전용 API가 없으므로 전체 목록에서 id로 검색
      const response = await fetch('/api/products?pageSize=30');
      if (!response.ok) throw new Error('상품을 불러오지 못했습니다.');
      const data: ProductListResponse = await response.json();
      const product = data.products.find((p) => p.id === id);
      if (!product) throw new Error('상품을 찾을 수 없습니다.');
      return product;
    },
    // 상세는 목록보다 오래 캐시해도 됨 — 같은 상품 재방문 시 5분간 재요청 안 함
    staleTime: 5 * 60 * 1000,
  });
}
