"use client";

import Link from "next/link";
import { useSession, type SessionUser } from "@/entities/session";
import { LogoutButton } from "@/features/auth";
import styles from "./CommerceHeaderAuth.module.css";

export function CommerceHeaderAuth({
  initialUser,
}: {
  initialUser: SessionUser | null;
}) {
  const { user, isPending } = useSession();
  // 서버가 쿠키로 읽은 초기 로그인 상태를 초기 HTML·최초 페인트에 그대로 반영한다(JS 전에도 보임).
  // useSession 이 확정되기 전(isPending)엔 이 값을, 확정 후엔 실시간 값을 쓴다(로그인/로그아웃 반영).
  const shownUser = isPending ? initialUser : user;

  if (shownUser === null) {
    return (
      <Link href="/login" className={styles.loginLink}>
        로그인
      </Link>
    );
  }

  return (
    <div className={styles.authArea}>
      <span className={styles.userName}>{shownUser.name}</span>
      <LogoutButton />
    </div>
  );
}
