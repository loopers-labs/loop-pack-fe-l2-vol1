"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { AuthUser } from "@/types/auth";
import { SESSION_QUERY_KEY, sessionQueries } from "./queries";

// initialUser 는 서버 컴포넌트가 쿠키를 읽어 넘긴 값. 캐시가 비어 있을 때만 쓰인다
export function useSession(initialUser?: AuthUser | null) {
  const query = useQuery({
    ...sessionQueries.me(),
    ...(initialUser === undefined ? {} : { initialData: initialUser }),
  });

  return { user: query.data ?? null, isPending: query.isPending };
}

export function useSessionActions() {
  const queryClient = useQueryClient();

  return {
    setUser: (user: AuthUser | null) => queryClient.setQueryData(SESSION_QUERY_KEY, user),
    getUser: () => queryClient.getQueryData<AuthUser | null>(SESSION_QUERY_KEY) ?? null,
  };
}
