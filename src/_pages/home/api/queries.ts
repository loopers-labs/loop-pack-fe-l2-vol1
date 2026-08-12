import { queryOptions } from "@tanstack/react-query";
import type { MockApiScenario } from "@/types/commerce";
import { getHome } from "./get-home";

export const homeQueries = {
  home: (scenario: MockApiScenario | null) =>
    queryOptions({
      queryKey: ["home", { scenario }] as const,
      queryFn: () => getHome(scenario),
      staleTime: 5 * 60 * 1000,
    }),
};
