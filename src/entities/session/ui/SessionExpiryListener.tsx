"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { onSessionExpired, REDIRECT_PARAM } from "@/shared/lib";
import { sessionQueries } from "../api/sessionQueries";

// 세션 만료(성공 후 401)를 한 곳에서 처리한다: 세션 캐시를 비우고 복원 경로를 실어 /login 으로 보낸다.
// 만료 메시지는 붙이지 않는다 — 미로그인 fallback 의 인라인 안내와 역할이 겹치지 않게.
export function SessionExpiryListener() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // 모듈 스코프 이벤트 버스 구독은 외부 시스템 동기화라 useEffect 가 정당하다.
  useEffect(() => {
    return onSessionExpired(() => {
      queryClient.removeQueries({ queryKey: sessionQueries.all() });

      // 이 리스너는 앱 최상위에 마운트되는데 useSearchParams 를 쓰면 전체 앱이 CSR bailout 으로
      // 끌려가 정적 예산이 깨진다. 콜백은 401 수신 시점(클라이언트 이벤트)에만 도니 window 를 직접 읽는다.
      const currentPath = window.location.pathname + window.location.search;

      router.replace(
        `/login?${REDIRECT_PARAM}=${encodeURIComponent(currentPath)}`,
      );
    });
  }, [queryClient, router]);

  return null;
}
