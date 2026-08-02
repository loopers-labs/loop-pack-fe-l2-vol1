import { queryOptions } from "@tanstack/react-query";
import { isHttpError } from "@/shared/api";
import { fetchHome } from "./fetch";

export function homeQueryOptions() {
  return queryOptions({
    queryKey: ["commerce", "home"] as const,
    queryFn: fetchHome,
    staleTime: 300000,
    gcTime: 600000,
    throwOnError: (error) => (isHttpError(error) ? error.status >= 500 : true),
  });
}
