"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { sessionQueries, type SessionResponse } from "@/entities/session";
import {
  registerProviders,
  initAnalytics,
  setCommonProperties,
  consoleProvider,
  createSessionId,
  detectDevice,
} from "@/shared/analytics";

// provider 등록 → 공통 프로퍼티 주입 → 초기화(그 전에 쌓인 큐 flush)를 앱 시작 시 한 번.
// 브라우저에서만 도는 부팅이라 mount effect.
export function AnalyticsBootstrap() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const sessionId = createSessionId();

    registerProviders([consoleProvider]);

    // track 마다 재평가된다 — ts 는 그 순간, userId 는 로그인 이후에야 채워진다.
    // name 은 이벤트명이라 여기서 모른다 → consoleProvider 가 봉투에 찍는다.
    setCommonProperties(() => {
      const session = queryClient.getQueryData<SessionResponse>(
        sessionQueries.me().queryKey,
      );
      const userId = session?.user.id;

      return {
        sessionId,
        ts: new Date().toISOString(),
        device: detectDevice(navigator.userAgent),
        ...(userId ? { userId } : {}),
      };
    });

    void initAnalytics();
  }, [queryClient]);

  return null;
}
