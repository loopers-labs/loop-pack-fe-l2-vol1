import { CommerceApiError } from "@/shared/api/commerce-client";
import { queryOptions } from "@tanstack/react-query";
import { getHome } from "./get-home";

export const homeQueries = {
  home: () =>
    queryOptions({
      queryKey: ["home"] as const,
      queryFn: getHome,
      staleTime: 5 * 60 * 1000,
      // 5xx는 error.tsx 경계로 전파, 4xx·네트워크 오류는 인라인 처리 (RFC §5.3)
      throwOnError: (error) => error instanceof CommerceApiError && error.status >= 500,
    }),
};
