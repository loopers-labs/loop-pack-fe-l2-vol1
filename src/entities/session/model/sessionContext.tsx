"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { SessionUser } from "./types";

// 서버가 쿠키로 확정한 초기 로그인 상태. 루트에서 한 번 읽어 서버·클라이언트 렌더에 동일하게 흐른다.
// httpOnly 세션 쿠키를 클라이언트가 못 읽는 문제를, 서버가 읽은 값을 context 로 내려 해결한다.
// 기본값 null(미로그인) — Provider 밖에서 쓰면 로그아웃으로 본다(테스트·비세션 화면).
const InitialUserContext = createContext<SessionUser | null>(null);

export function SessionProvider({
  initialUser,
  children,
}: {
  initialUser: SessionUser | null;
  children: ReactNode;
}) {
  return (
    <InitialUserContext.Provider value={initialUser}>
      {children}
    </InitialUserContext.Provider>
  );
}

export function useInitialUser(): SessionUser | null {
  return useContext(InitialUserContext);
}
