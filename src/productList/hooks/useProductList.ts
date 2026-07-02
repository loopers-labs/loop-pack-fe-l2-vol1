import {
  keepPreviousData,
  queryOptions,
  useQuery,
} from '@tanstack/react-query';

import { PAGE_SIZE } from '../constants';
import {
  fetchProducts,
  type FetchProductsParams,
} from '../services/productApi';
import { getProductCardInfo } from '../utils/productCard';

import { useDebounce } from './useDebounce';

type UseProductListParams = Omit<FetchProductsParams, 'size'> & {
  size?: number;
};

const PRODUCT_LIST_DEBOUNCE_MS = 300;

function productListQueryOptions(params: FetchProductsParams) {
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

export function useProductList({
  category,
  sortBy,
  searchQuery,
  page,
  size = PAGE_SIZE,
  minPrice,
  maxPrice,
  inStockOnly,
}: UseProductListParams) {
  const debouncedSearchQuery = useDebounce(
    searchQuery,
    PRODUCT_LIST_DEBOUNCE_MS,
  );
  const debouncedMinPrice = useDebounce(minPrice, PRODUCT_LIST_DEBOUNCE_MS);
  const debouncedMaxPrice = useDebounce(maxPrice, PRODUCT_LIST_DEBOUNCE_MS);

  const query = useQuery(
    productListQueryOptions({
      category,
      sortBy,
      searchQuery: debouncedSearchQuery,
      page,
      size,
      minPrice: debouncedMinPrice,
      maxPrice: debouncedMaxPrice,
      inStockOnly,
    }),
  );

  const products = query.data?.products ?? [];
  const totalCount = query.data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / size));

  return {
    ...query,
    products,
    totalCount,
    totalPages,
  };
}
