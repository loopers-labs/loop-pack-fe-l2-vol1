"use client";

import { useEffect, useEffectEvent, useRef } from "react";
import { trackEvent } from "./analytics";
import type { AnalyticsEventName, AnalyticsEvents } from "./events";

// 화면 진입 이벤트. 마운트 시점의 프로퍼티를 한 번만 보낸다.
// - useEffectEvent 로 최신 props 를 읽되 effect 의존성에서는 빼서, 프로퍼티가 바뀌어도 다시 보내지 않는다
// - 한 번 보냈으면 다시 보내지 않는다 — dev StrictMode 의 effect 재실행, enabled 의 false→true 재진입에도 1회다
export function useTrackOnMount<Name extends AnalyticsEventName>(
  name: Name,
  properties: AnalyticsEvents[Name],
  enabled = true,
): void {
  const sent = useRef(false);
  const send = useEffectEvent(() => trackEvent(name, properties));

  useEffect(() => {
    if (!enabled || sent.current) {
      return;
    }
    sent.current = true;
    send();
  }, [enabled]);
}
