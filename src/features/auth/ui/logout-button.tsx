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
      onClick={() => mutate(undefined, { onSuccess: () => router.push("/") })}
    >
      로그아웃
    </button>
  );
}
