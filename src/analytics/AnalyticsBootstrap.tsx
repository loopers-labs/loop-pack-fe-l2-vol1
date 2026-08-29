"use client";

import { useEffect } from "react";
import { registerProviders, initAnalytics } from "./logger";
import { consoleProvider } from "./consoleProvider";

// provider 등록 → 초기화(그 전에 쌓인 큐 flush)를 앱 시작 시 한 번. 브라우저에서만 도는 부팅이라 mount effect.
export function AnalyticsBootstrap() {
  useEffect(() => {
    registerProviders([consoleProvider]);
    void initAnalytics();
  }, []);

  return null;
}
