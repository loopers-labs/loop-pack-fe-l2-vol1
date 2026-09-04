"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { resetCart } from "@/entities/cart";
import { ANONYMOUS, AUTH_MUTATION_KEY, SESSION_QUERY_KEY } from "@/entities/session";
import { resetWishlist } from "@/entities/wishlist";
import { resetUser } from "@/shared/analytics";
import { postJson } from "@/shared/api";

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    // 세션 판정에서 빼는 표식. 로그인 실패의 401은 "자격 증명이 틀렸다"는
    // 뜻이지 "세션이 만료됐다"가 아니다(entities/session/model/sessionExpiry.ts).
    mutationKey: [...AUTH_MUTATION_KEY, "logout"],
    mutationFn: () => postJson<null>("/api/auth/logout"),
    onSuccess: () => {
      // ── 로그아웃 시 클라이언트 상태를 지운다 ────────────────────────────
      // 장바구니·위시리스트는 서버에 없고 이 브라우저에만 있다. 남겨두면 공용
      // PC에서 다음 사람이 앞사람이 담은 것을 본다. "편의"보다 "남의 흔적이
      // 보이지 않는 것"이 크다고 봤다.
      //
      // 반대 선택(남기기)도 가능하다 — 로그인은 결제 경계에서만 요구하므로
      // 장바구니는 비로그인 자산이라고 볼 수 있다. 그 경우 localStorage로
      // 영속시켜야 말이 되는데, 그러면 공용 PC 문제가 더 커진다. 그래서 지운다.
      resetCart();
      resetWishlist();
      // 계측의 사용자 식별도 끊는다. 안 끊으면 다음 사람의 이벤트에 앞사람
      // userId가 붙는다 — 위 장바구니 초기화와 같은 이유다.
      resetUser();

      // 서버 상태는 캐시를 통째로 비운다. 주문 내역처럼 그 사람 것만 담긴 응답이
      // 남아 있으면 다음 사람이 그것을 본다.
      // 날아가 있던 세션 조회가 늦게 끝나 anonymous를 덮지 않게 먼저 끊는다.
      void queryClient.cancelQueries({ queryKey: SESSION_QUERY_KEY });
      queryClient.clear();
      queryClient.setQueryData(SESSION_QUERY_KEY, ANONYMOUS);
      router.replace("/");
      router.refresh();
    },
  });
}
