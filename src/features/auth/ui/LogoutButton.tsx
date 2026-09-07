"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { logout } from "../api/authMutations";
import { sessionQueries } from "@/entities/session";
import { useClearCart } from "@/entities/cart";
import { useClearWishlist } from "@/entities/wishlist";
import styles from "./LogoutButton.module.css";

export function LogoutButton() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const clearCart = useClearCart();
  const clearWishlist = useClearWishlist();

  const mutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      // 세션 캐시를 통째로 비워 useSession 소비처가 즉시 로그아웃 상태가 된다.
      queryClient.removeQueries({ queryKey: sessionQueries.all() });
      // cart·wishlist 는 localStorage 에 계정과 무관하게 남기 때문에 삭제한다.
      clearCart();
      clearWishlist();
      router.refresh();
    },
  });

  return (
    <button
      type="button"
      className={styles.logoutButton}
      disabled={mutation.isPending}
      onClick={() => mutation.mutate()}
    >
      로그아웃
    </button>
  );
}
