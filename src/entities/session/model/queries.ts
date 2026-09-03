import { queryOptions } from "@tanstack/react-query";
import type { AuthUser } from "@/types/auth";
import { getSession } from "../api/get-session";

export const SESSION_QUERY_KEY = ["session"] as const;

export const sessionQueries = {
  me: () =>
    queryOptions<AuthUser | null>({
      queryKey: SESSION_QUERY_KEY,
      queryFn: ({ signal }) => getSession(signal),
      // 세션은 요청마다 값이 달라질 수 있는 서버 상태다. 서버가 초기 HTML 과 함께 준 값을 먼저 보여주되
      // 마운트·탭 복귀 시 다시 확인한다 — 보호 데이터 요청이 없는 화면(마이페이지)에서도 만료를 알 수 있다
      staleTime: 0,
      retry: false,
    }),
};
