import { getHome, getProducts, type ProductListParams } from "@/services/commerce";
import { keepPreviousData, queryOptions } from "@tanstack/react-query";

export const commerceQueries = {
  home: () =>
    queryOptions({
      queryKey: ["home"] as const,
      queryFn: getHome,
      staleTime: 5 * 60 * 1000,
    }),

  products: (params: ProductListParams) => {
    const normalized = { ...params, q: params.q.trim() };
    return queryOptions({
      queryKey: ["products", normalized] as const,
      queryFn: () => getProducts(normalized),
      staleTime: 60 * 1000,
      gcTime: 5 * 60 * 1000,
      placeholderData: keepPreviousData,
    });
  },
};
