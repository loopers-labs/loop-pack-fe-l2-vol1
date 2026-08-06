import { queryOptions } from "@tanstack/react-query";
import { getHome } from "../api/homeApi";

export const homeQueries = {
  all: () => ["home"] as const,
  main: () =>
    queryOptions({
      queryKey: [...homeQueries.all(), "main"],
      queryFn: getHome,
      staleTime: 1000 * 60 * 5,
    }),
};
