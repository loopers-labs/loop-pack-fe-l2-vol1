"use client";

import { useEffect, useEffectEvent, useRef } from "react";
import { trackEvent } from "./analytics";
import type { AnalyticsEventName, AnalyticsEvents } from "./events";

// 화면 진입 이벤트. enabled 가 참인 구간(진입)마다 한 번 보낸다.
// - useEffectEvent 로 최신 props 를 읽되 effect 의존성에서는 빼서, 프로퍼티가 바뀌어도 다시 보내지 않는다
// - dev StrictMode 의 effect 재실행(mount→unmount→mount)에는 1회다 — cleanup 에서 sent 를 되돌리지 않는다
// - enabled 가 false 로 내려가면 sent 를 되돌린다 — 주문서에 머문 채 장바구니가 비었다 다시 차면 order_start 가
//   다시 나가야 한다. 퍼널 분모가 되는 이벤트를 "마운트당 1회" 로 막으면 재진입이 누락돼 전환율이 부풀려진다
export function useTrackOnMount<Name extends AnalyticsEventName>(
  name: Name,
  properties: AnalyticsEvents[Name],
  enabled = true,
): void {
  const sent = useRef(false);
  const send = useEffectEvent(() => trackEvent(name, properties));

  useEffect(() => {
    if (!enabled) {
      sent.current = false;
      return;
    }
    if (sent.current) {
      return;
    }
    sent.current = true;
    send();
  }, [enabled]);
}
