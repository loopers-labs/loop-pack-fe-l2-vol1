import { queryOptions } from "@tanstack/react-query";
import { getSession } from "../api/sessionApi";

const sessionQueriesAll = () => ["session"] as const;

export const sessionQueries = {
  all: sessionQueriesAll,
  me: () =>
    queryOptions({
      queryKey: [...sessionQueriesAll(), "me"] as const,
      queryFn: getSession,
      staleTime: 1000 * 60,
      throwOnError: false,
    }),
};
