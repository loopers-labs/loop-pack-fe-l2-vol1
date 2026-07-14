import { queryOptions } from "@tanstack/react-query";
import { getHome } from "../api/homeApi";
import type { MockApiScenario } from "@/types/api";

type HomeQueryParams = {
  scenario?: MockApiScenario;
};

export const homeQueries = {
  all: () => ["home"] as const,
  main: (params: HomeQueryParams = {}) =>
    queryOptions({
      queryKey: [...homeQueries.all(), "main", params],
      queryFn: () => getHome(params),
      staleTime: 1000 * 60 * 5,
    }),
};
