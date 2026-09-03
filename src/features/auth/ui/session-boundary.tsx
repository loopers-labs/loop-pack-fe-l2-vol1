"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ORDERS_QUERY_KEY } from "@/entities/order";
import { logout, SESSION_QUERY_KEY } from "@/entities/session";
import { isUnauthorizedError } from "@/shared/api/commerce-client";
import { buildLoginUrl } from "@/shared/lib/return-to";
import type { AuthUser } from "@/types/auth";

// 세션 만료(401)를 처리하는 유일한 자리. 루트 layout 에 한 번 마운트된다.
//
// 판정 기준 — "이 탭이 로그인 상태라고 믿고 있던 중에 받은 401" 만 만료로 본다.
// 세션 캐시가 비어 있을 때의 401(로그인 폼의 자격 증명 실패 등)은 만료가 아니라 각 화면의 에러다.
//
// 처리 — 죽은 쿠키를 서버에서 지우고(logout 은 노브 영향 없이 항상 204) 클라이언트 캐시를 비운 뒤,
// 지금 보던 경로를 next 로 실어 로그인으로 보낸다. 로그인 페이지는 reason=expired 를 읽어 안내를 띄운다
export function SessionBoundary() {
  const queryClient = useQueryClient();
  const router = useRouter();

  useEffect(() => {
    let handling = false;

    const handle = async (error: unknown) => {
      if (handling || !isUnauthorizedError(error)) {
        return;
      }
      if (queryClient.getQueryData<AuthUser | null>(SESSION_QUERY_KEY) == null) {
        return;
      }

      handling = true;
      try {
        await logout().catch(() => undefined);
        queryClient.setQueryData(SESSION_QUERY_KEY, null);
        queryClient.removeQueries({ queryKey: ORDERS_QUERY_KEY });
        const { pathname, search } = window.location;
        router.replace(buildLoginUrl(`${pathname}${search}`, "expired"));
      } finally {
        handling = false;
      }
    };

    const unsubscribeQueries = queryClient.getQueryCache().subscribe((event) => {
      if (event.type === "updated" && event.action.type === "error") {
        void handle(event.action.error);
      }
    });
    const unsubscribeMutations = queryClient.getMutationCache().subscribe((event) => {
      if (event.type === "updated" && event.action.type === "error") {
        void handle(event.action.error);
      }
    });

    return () => {
      unsubscribeQueries();
      unsubscribeMutations();
    };
  }, [queryClient, router]);

  return null;
}
