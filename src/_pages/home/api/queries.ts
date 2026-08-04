import { CommerceApiError } from "@/shared/api/commerce-client";
import { queryOptions } from "@tanstack/react-query";
import { getHome } from "./get-home";

export const homeQueries = {
  home: () =>
    queryOptions({
      queryKey: ["home"] as const,
      queryFn: getHome,
      staleTime: 5 * 60 * 1000,
      throwOnError: (error) => error instanceof CommerceApiError && error.status >= 500,
    }),
};
