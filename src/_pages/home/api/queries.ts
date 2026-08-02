import { queryOptions } from "@tanstack/react-query";
import { fetchHome } from "./fetch";

export function homeQueryOptions() {
  return queryOptions({
    queryKey: ["commerce", "home"] as const,
    queryFn: fetchHome,
    staleTime: 300000,
    gcTime: 600000,
  });
}
