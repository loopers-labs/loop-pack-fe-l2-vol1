"use client";

import { useRouter } from "next/navigation";
import { useLogout } from "../model/use-logout";

export function LogoutButton() {
  const router = useRouter();
  const { mutate, isPending } = useLogout();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() =>
        mutate(undefined, {
          onSuccess: () => {
            // 로그인 상태로 서버 렌더된 화면(마이페이지 등)이 라우터 캐시에 남지 않게 한다
            router.refresh();
            router.push("/");
          },
        })
      }
    >
      로그아웃
    </button>
  );
}
