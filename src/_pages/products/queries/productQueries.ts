import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import { getProducts } from "../api/productApi";
import type { ProductListQuery } from "../api/productApi";

export const productQueries = {
  all: () => ["products"] as const,
  list: (params: ProductListQuery = {}) =>
    queryOptions({
      queryKey: [...productQueries.all(), "list", params],
      queryFn: ({ signal }) => getProducts(params, { signal }),
      staleTime: 1000 * 60,
      placeholderData: keepPreviousData,
      throwOnError: false,
    }),
};
