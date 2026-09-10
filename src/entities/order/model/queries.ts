import { queryOptions } from "@tanstack/react-query";
import { getOrders } from "../api/orders";

export const ORDERS_QUERY_KEY = ["orders"] as const;

export const orderQueries = {
  list: () =>
    queryOptions({
      queryKey: ORDERS_QUERY_KEY,
      queryFn: getOrders,
      // 401 은 재시도해도 같은 답이다. 만료 판정을 늦추지 않는다
      retry: false,
    }),
};
