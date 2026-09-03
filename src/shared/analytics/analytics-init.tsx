"use client";

import { useEffect } from "react";
import { setupAnalytics } from "./analytics";

// 루트 Providers 안에 한 번 마운트된다. React 는 자식 effect 를 먼저 실행하므로 페이지 진입 이벤트(자식)가
// 이 초기화(부모)보다 앞서 track() 되고, logger 큐가 그것을 담아 두었다가 초기화 직후 순서대로 흘려보낸다
export function AnalyticsInit() {
  useEffect(() => {
    void setupAnalytics();
  }, []);

  return null;
}
