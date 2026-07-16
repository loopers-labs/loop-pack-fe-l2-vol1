import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import { getProducts } from "../api/productApi";
import type { ProductListQuery } from "../api/productApi";
import type { MockApiScenario } from "@/types/api";

type ProductListQueryParams = ProductListQuery & {
  scenario?: MockApiScenario;
};

export const productQueries = {
  all: () => ["products"] as const,
  list: (params: ProductListQueryParams = {}) =>
    queryOptions({
      queryKey: [...productQueries.all(), "list", params],
      queryFn: () => getProducts(params),
      staleTime: 1000 * 60,
      placeholderData: keepPreviousData,
    }),
};
