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
          // 요청이 실패해도 이동한다 — 버튼을 눌렀는데 아무 일도 없는 화면을 만들지 않는다.
          // refresh 는 로그인 상태로 서버 렌더된 화면(마이페이지 등)이 라우터 캐시에 남지 않게 한다
          onSettled: () => {
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
