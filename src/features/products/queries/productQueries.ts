import { queryOptions } from "@tanstack/react-query";
import { getProducts } from "../api/productApi";
import type { MockApiScenario, ProductListQuery } from "@/types/commerce";

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
    }),
};
