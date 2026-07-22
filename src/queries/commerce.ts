import { getHome, getProducts, type ProductListParams } from "@/services/commerce";
import { keepPreviousData, queryOptions } from "@tanstack/react-query";

export const commerceQueries = {
  home: () =>
    queryOptions({
      queryKey: ["home"] as const,
      queryFn: getHome,
      staleTime: 5 * 60 * 1000,
    }),

  products: (params: ProductListParams) =>
    queryOptions({
      queryKey: ["products", params] as const,
      queryFn: () => getProducts(params),
      staleTime: 60 * 1000,
      placeholderData: keepPreviousData,
    }),
};
