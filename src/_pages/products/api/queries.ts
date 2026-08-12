import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import { getProducts, type ProductListParams } from "./get-products";

export const productListQueries = {
  list: (params: ProductListParams) => {
    const normalized = { ...params, q: params.q.trim() };
    return queryOptions({
      queryKey: ["products", normalized] as const,
      queryFn: () => getProducts(normalized),
      staleTime: 60 * 1000,
      placeholderData: keepPreviousData,
    });
  },
};
