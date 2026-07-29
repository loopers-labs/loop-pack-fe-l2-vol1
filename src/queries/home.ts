import { queryOptions } from "@tanstack/react-query";
import { getHome } from "@/services/commerce";

const HOME_STALE_TIME = 60 * 1000;

export const homeQueries = {
  all: () => ["home"] as const,
  detail: () =>
    queryOptions({
      queryKey: homeQueries.all(),
      queryFn: getHome,
      staleTime: HOME_STALE_TIME,
    }),
};
