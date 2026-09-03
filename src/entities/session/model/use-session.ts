"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { identifyUser, resetUser } from "@/shared/analytics";
import type { AuthUser } from "@/types/auth";
import { SESSION_QUERY_KEY, sessionQueries } from "./queries";

// initialUser 는 서버 컴포넌트가 쿠키를 읽어 넘긴 값. 캐시가 비어 있을 때만 쓰인다.
// 재확인이 401 로 실패해도 data 는 직전 값이 남으므로, null 로 바꾸는 일은 SessionBoundary 가 한다
export function useSession(initialUser?: AuthUser | null) {
  const query = useQuery({
    ...sessionQueries.me(),
    ...(initialUser === undefined ? {} : { initialData: initialUser }),
  });
  const user = query.data ?? null;
  const userId = user?.id ?? null;

  // 분석 도구의 identify · reset 은 세션 상태 전이가 유일한 출처다. 로그인 폼·로그아웃 버튼·만료 처리가
  // 각자 부르지 않아도 여기서 한 번 따라간다 (identifyUser · resetUser 는 같은 상태면 무시한다)
  useEffect(() => {
    if (userId === null) {
      resetUser();
    } else {
      identifyUser(userId);
    }
  }, [userId]);

  return { user, isPending: query.isPending };
}

export function useSessionActions() {
  const queryClient = useQueryClient();

  return {
    setUser: (user: AuthUser | null) => queryClient.setQueryData(SESSION_QUERY_KEY, user),
    getUser: () => queryClient.getQueryData<AuthUser | null>(SESSION_QUERY_KEY) ?? null,
  };
}
