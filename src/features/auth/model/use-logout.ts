"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ORDERS_QUERY_KEY } from "@/entities/order";
import { logout, useSessionActions } from "@/entities/session";

// 로그아웃은 계정에 묶인 서버 상태(세션·주문)만 비운다.
// 장바구니·위시리스트는 로그인 전에도 쓰는 게스트 상태라 그대로 둔다 (persist 가 없어 새로고침에 사라지는 것도 기존 스펙)
export function useLogout() {
  const queryClient = useQueryClient();
  const { setUser } = useSessionActions();

  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      setUser(null);
      queryClient.removeQueries({ queryKey: ORDERS_QUERY_KEY });
    },
  });
}
