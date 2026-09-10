"use client";

import { useEffect } from "react";
import { setupAnalytics } from "./analytics";

// 루트 Providers 안에 한 번 마운트된다. 프로바이더 초기화(비동기)를 시작하는 자리이며, 그 전에 화면이
// 보낸 이벤트는 로거 큐에 담겨 초기화 직후 순서대로 나간다. 트리 안의 위치는 결과에 영향을 주지 않는다 —
// 공통 프로퍼티 등록은 trackEvent 가 첫 호출 때 동기로 보장한다
export function AnalyticsInit() {
  useEffect(() => {
    void setupAnalytics();
  }, []);

  return null;
}
