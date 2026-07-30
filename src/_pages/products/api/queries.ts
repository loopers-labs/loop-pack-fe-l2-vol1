import { CommerceApiError } from "@/shared/api/commerce-client";
import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import { getProducts, type ProductListParams } from "./get-products";

export const productListQueries = {
  list: (params: ProductListParams) => {
    const normalized = { ...params, q: params.q.trim() };
    return queryOptions({
      queryKey: ["products", normalized] as const,
      queryFn: () => getProducts(normalized),
      staleTime: 60 * 1000,
      gcTime: 5 * 60 * 1000,
      placeholderData: keepPreviousData,
      // 5xx는 error.tsx 경계로 전파, 4xx·네트워크 오류는 인라인 처리 (RFC §5.3)
      throwOnError: (error) => error instanceof CommerceApiError && error.status >= 500,
    });
  },
};
