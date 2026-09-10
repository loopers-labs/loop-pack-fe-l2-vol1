"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { logout } from "@/entities/session";
import { clearClientSession } from "./clear-client-session";

// 로그아웃 요청의 성공·실패와 무관하게 클라이언트는 로그아웃 상태로 수렴한다 — 만료 경로(SessionBoundary)가
// logout().catch 뒤에 무조건 정리하는 것과 같은 정책. 서버 쿠키가 남았다면 다음 서버 렌더가 다시 알려 준다
export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    onSettled: () => clearClientSession(queryClient),
  });
}
