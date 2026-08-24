import { queryOptions } from '@tanstack/react-query';
import {
  fetchProductById,
  fetchProductList,
} from './productService';
import { PRODUCT_LIST_DEFAULTS } from '@/entities/product/model/constants';
import type { ProductListQuery } from '@/entities/product/model/types';

export function productListQueryOptions(params: ProductListQuery) {
  const {
    q,
    category = PRODUCT_LIST_DEFAULTS.category,
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
    queryFn: ({ signal }) => fetchProductById(id, { signal }),
    staleTime: 0,
    gcTime: 10 * 60 * 1000,
  });
}
