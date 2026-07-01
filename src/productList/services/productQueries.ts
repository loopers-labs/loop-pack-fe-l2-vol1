import { keepPreviousData, queryOptions } from '@tanstack/react-query';

import { getProductCardInfo } from '../productCard';

import { fetchProducts, type FetchProductsParams } from './productApi';

export function productListQueryOptions(params: FetchProductsParams) {
  return queryOptions({
    queryKey: ['products', params],
    queryFn: () => fetchProducts(params),
    placeholderData: keepPreviousData,
    select: (data) => ({
      ...data,
      products: data.products.map((product) => ({
        ...product,
        ...getProductCardInfo(product),
      })),
    }),
  });
}
