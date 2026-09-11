"use client";
import { useEffect } from "react";
import { consoleProvider } from "@/analytics/consoleProvider";
import { initAnalytics, registerProviders, setCommonProperties } from "@/analytics/logger";
import { commonProperties } from "@/shared/analytics";

// ── initAnalytics()를 어디서 부르는가 ───────────────────────────────────────
// 프로바이더 등록과 공통 프로퍼티는 **모듈 스코프**에서 한다. 이건 동기라서
// 어떤 화면이 track()을 부르기 전에 이미 끝나 있다. 여기서 미루면 초기화 전
// 이벤트가 공통 프로퍼티 없이 큐에 담긴다.
//
// `initAnalytics()`는 effect에서 부른다. 프로바이더의 initialize()가 SDK 로드를
// 전제하는 비동기 작업이라 렌더 중에 부를 수 없고, 서버에서 부르면 window가 없다.
//
// 이 위치가 큐에 쌓이는 이벤트를 결정한다. Providers 안 = 클라이언트 트리의
// 최상단이므로, 첫 화면의 view 이벤트(예: product_list_view)는 초기화보다 먼저
// 실행될 수 있다. 그건 로거가 큐에 담아 초기화 직후 순서대로 흘려보낸다 —
// 그래서 첫 진입 이벤트가 유실되지 않는다.
registerProviders([consoleProvider]);
setCommonProperties(commonProperties);

export function AnalyticsBootstrap() {
  useEffect(() => {
    // 초기화는 idempotent다(로거가 initialized를 본다). StrictMode의 이중 실행에
    // 안전하고, 여기서 정리(cleanup)할 것은 없다 — 탭이 살아 있는 동안 유지된다.
    void initAnalytics();
  }, []);

  return null;
}
