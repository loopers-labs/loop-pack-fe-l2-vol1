import { keepPreviousData, queryOptions } from '@tanstack/react-query';

import { fetchProducts, type FetchProductsParams } from './productApi';

export function productListQueryOptions(params: FetchProductsParams) {
  return queryOptions({
    queryKey: ['products', params],
    queryFn: () => fetchProducts(params),
    placeholderData: keepPreviousData,
  });
}
