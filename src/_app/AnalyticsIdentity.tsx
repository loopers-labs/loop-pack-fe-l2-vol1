"use client";

import { useEffect } from "react";
import { useSession } from "@/entities/session";
import { identify, reset } from "@/shared/analytics";

// 애널리틱스 사용자 신원을 세션 상태에 동기화(외부 시스템 sync). 로그인/로그아웃/재진입/만료를
// 각 핸들러가 아니라 여기 한 곳에서 반영한다 — 세션 쿼리가 곧 "현재 사용자"의 단일 출처.
export function AnalyticsIdentity() {
  const { user, isPending } = useSession();
  const userId = user?.id ?? null;

  useEffect(() => {
    if (isPending) return; // 세션 확정 전엔 판단 보류

    if (userId) identify(userId);
    else reset();
  }, [isPending, userId]);

  return null;
}
