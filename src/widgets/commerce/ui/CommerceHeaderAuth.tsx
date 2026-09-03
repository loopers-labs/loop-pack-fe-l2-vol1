"use client";

import Link from "next/link";
import { useSession } from "@/entities/session";
import { LogoutButton } from "@/features/auth";
import styles from "./CommerceHeaderAuth.module.css";

export function CommerceHeaderAuth() {
  // useSession 이 확정 전엔 서버가 준 초기 로그인 상태를, 확정 후엔 실시간 값을 준다(로그인/로그아웃/만료 반영).
  const { user } = useSession();

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
