"use client";

import { useQuery } from "@tanstack/react-query";
import { sessionQueries } from "../api/sessionQueries";

export function useSession() {
  // 클라이언트는 httpOnly 세션 쿠키를 못 읽으므로 /api/auth/me 응답이 유일한 로그인 신호다.
  // 401 이면 requestJson 이 throw → 쿼리 error → data 없음 → 로그아웃으로 환원된다.
  const { data, isPending } = useQuery(sessionQueries.me());
  const user = data?.user ?? null;

  return {
    user,
    isAuthenticated: user !== null,
    isPending,
  };
}
