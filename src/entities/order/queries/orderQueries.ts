import { queryOptions } from "@tanstack/react-query";
import { getOrders } from "../api/orderApi";

const orderQueriesAll = () => ["orders"] as const;

export const orderQueries = {
  all: orderQueriesAll,
  list: () =>
    queryOptions({
      queryKey: [...orderQueriesAll(), "list"] as const,
      queryFn: getOrders,
      staleTime: 1000 * 60,
      throwOnError: false,
    }),
};
