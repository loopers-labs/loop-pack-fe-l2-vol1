"use client";

import Link from "next/link";
import { useSession } from "@/entities/session";
import { LogoutButton } from "@/features/auth";
import styles from "./CommerceHeaderAuth.module.css";

export function CommerceHeaderAuth() {
  const { user, isPending } = useSession();

  // 세션 확정 전에는 로그인/로그아웃 어느 쪽도 단정하지 않고 자리만 예약한다(깜빡임 방지).
  if (isPending) {
    return <span className={styles.placeholder} aria-hidden />;
  }

  if (user === null) {
    return (
      <Link href="/login" className={styles.loginLink}>
        로그인
      </Link>
    );
  }

  return (
    <div className={styles.authArea}>
      <span className={styles.userName}>{user.name}</span>
      <LogoutButton />
    </div>
  );
}
