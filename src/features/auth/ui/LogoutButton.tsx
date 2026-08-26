"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { logout } from "../api/authMutations";
import { sessionQueries } from "@/entities/session";
import styles from "./LogoutButton.module.css";

export function LogoutButton() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      // 세션 캐시를 통째로 비워 useSession 소비처가 즉시 로그아웃 상태가 된다.
      // TODO: cart·wishlist 정리를 여기 onSuccess 에 붙인다.
      queryClient.removeQueries({ queryKey: sessionQueries.all() });
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
