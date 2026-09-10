"use client";

import Link from "next/link";
import { useSession } from "@/entities/session";
import { LogoutButton } from "@/features/auth";
import type { AuthUser } from "@/types/auth";

type HeaderAuthProps = {
  // 서버 layout 이 쿠키를 읽어 넘긴 초기값. JavaScript 실행 전 HTML 에도 로그인 상태가 보인다
  initialUser: AuthUser | null;
};

export function HeaderAuth({ initialUser }: HeaderAuthProps) {
  const { user } = useSession(initialUser);

  if (user === null) {
    return <Link href="/login">로그인</Link>;
  }

  return (
    <>
      <span>{user.name}님</span>
      <Link href="/mypage">마이페이지</Link>
      <Link href="/orders">주문 내역</Link>
      <LogoutButton />
    </>
  );
}
