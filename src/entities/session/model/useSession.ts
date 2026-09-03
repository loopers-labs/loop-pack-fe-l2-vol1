"use client";

import { useQuery } from "@tanstack/react-query";
import { sessionQueries } from "../api/sessionQueries";
import { useInitialUser } from "./sessionContext";

export function useSession() {
  // 서버가 쿠키로 확정한 초기 로그인 상태. 로그아웃(null)이면 /api/auth/me 로 같은 401 을 다시 묻지 않는다.
  // 세션이 있을 때만 /me 로 실제 사용자·만료(쿠키는 유효하나 서버가 401)를 확인한다.
  const initialUser = useInitialUser();
  const isLoggedOut = initialUser === null;

  const { data, isPending: queryPending } = useQuery({
    ...sessionQueries.me(),
    enabled: !isLoggedOut,
  });

  // 로그아웃은 서버가 확정 → 대기 없이 즉시. 로그인은 /me 확정 전까지 대기.
  const isPending = !isLoggedOut && queryPending;
  // 확정 전엔 서버가 준 initialUser, 확정 후엔 /me 결과(만료면 null).
  const user = isPending ? initialUser : (data?.user ?? null);

  return {
    user,
    isAuthenticated: user !== null,
    isPending,
  };
}
