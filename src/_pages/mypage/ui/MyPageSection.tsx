"use client";

import { useSession } from "@/entities/session";
import layout from "@/shared/ui/layout.module.css";
import styles from "./MyPageSection.module.css";

export function MyPageSection() {
  // 접근 가드는 proxy 담당 — 인증됨을 전제한다. 세션 로딩(또는 확정 전) 동안만 placeholder.
  const { user, isPending } = useSession();

  if (isPending || user === null) {
    return <p className={layout.status}>불러오는 중…</p>;
  }

  return (
    <dl className={styles.profile}>
      <dt>이름</dt>
      <dd>{user.name}</dd>
      <dt>이메일</dt>
      <dd>{user.email}</dd>
    </dl>
  );
}
