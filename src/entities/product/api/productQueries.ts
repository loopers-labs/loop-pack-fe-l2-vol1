import { queryOptions } from '@tanstack/react-query';
import { PRODUCT_LIST_DEFAULTS, fetchProductList, getProductById } from './productService';
import type { ProductListQuery } from '@/entities/product/model/types';

export function productListQueryOptions(params: ProductListQuery) {
  const {
    q,
    category,
    sort = PRODUCT_LIST_DEFAULTS.sort,
    page = PRODUCT_LIST_DEFAULTS.page,
    pageSize = PRODUCT_LIST_DEFAULTS.pageSize,
    scenario,
  } = params;

  return queryOptions({
    queryKey: ['products', { q, category, sort, page, pageSize, scenario }],
    queryFn: ({ signal }) =>
      fetchProductList(
        { q, category, sort, page, pageSize, scenario },
        { signal },
      ),
    staleTime: 0,
  });
}

export function productDetailQueryOptions(id: string) {
  return queryOptions({
    queryKey: ['products', 'detail', id],
    queryFn: () => {
      const product = getProductById(id);
      if (!product) throw new Error('상품을 찾을 수 없습니다.');
      return product;
    },
    staleTime: 0,
    gcTime: 10 * 60 * 1000,
  });
}
