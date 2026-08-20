import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import { getProducts } from "../api/productApi";
import type { ProductListQuery } from "../api/productApi";

const productQueriesAll = () => ["products"] as const;
const productListQueryKey = (params: ProductListQuery) =>
  [...productQueriesAll(), "list", params] as const;

export const productQueries = {
  all: productQueriesAll,
  list: (params: ProductListQuery = {}) =>
    queryOptions({
      queryKey: productListQueryKey(params),
      queryFn: ({ signal }) => getProducts(params, { signal }),
      staleTime: 1000 * 60,
      placeholderData: keepPreviousData,
      throwOnError: false,
    }),
  serverList: (params: ProductListQuery = {}) =>
    queryOptions({
      queryKey: productListQueryKey(params),
      queryFn: () => getProducts(params),
      staleTime: 1000 * 60,
      throwOnError: false,
    }),
};
