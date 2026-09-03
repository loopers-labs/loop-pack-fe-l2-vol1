import { queryOptions } from "@tanstack/react-query";
import { getSession } from "../api/get-session";

export const SESSION_QUERY_KEY = ["session"] as const;

export const sessionQueries = {
  me: () =>
    queryOptions({
      queryKey: SESSION_QUERY_KEY,
      queryFn: getSession,
      // 서버가 초기 HTML 과 함께 준 값을 그대로 쓴다. 만료는 보호 데이터 요청의 401 로 알게 된다
      staleTime: 5 * 60 * 1000,
      retry: false,
    }),
};
