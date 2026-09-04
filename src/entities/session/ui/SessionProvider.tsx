"use client";

import { createContext, type ReactNode, useContext } from "react";

import type { SessionUser } from "@/entities/session/model/types";

// 서버(layout)가 요청 시점 쿠키에서 판독한 로그인 상태를 클라 트리에 내린다.
// 이게 로그인 여부의 단일 진실이다 — 클라는 /api/auth/me를 따로 조회하지 않고 이 값만 읽는다.
// 컨텍스트는 모듈 밖으로 내보내지 않는다(useContext 오용 방지). 소비는 useSession으로만.
const SessionContext = createContext<SessionUser | null>(null);

type SessionProviderProps = {
  user: SessionUser | null;
  children: ReactNode;
};

export function SessionProvider({ user, children }: SessionProviderProps) {
  return <SessionContext.Provider value={user}>{children}</SessionContext.Provider>;
}

// 로그인 여부의 단일 진실을 읽는다. 만료 감지는 이 값이 아니라 보호 쿼리의 401로 트리거한다.
export function useSession() {
  const user = useContext(SessionContext);
  return { user, isLoggedIn: user !== null };
}
