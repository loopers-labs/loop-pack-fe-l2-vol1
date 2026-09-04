'use client';

import { useEffect } from 'react';
import { consoleProvider } from '@/analytics/consoleProvider';
import {
  initAnalytics,
  registerProviders,
  setCommonProperties,
} from '@/analytics/logger';
import { commonProperties } from '@/shared/analytics/common-properties';

// 프로바이더와 공통 프로퍼티는 **모듈 스코프**에서 등록한다.
// `track()`은 호출 시점에 공통 프로퍼티를 합쳐 큐에 넣으므로(로거 계약), 등록이 effect에 있으면
// 그보다 먼저 도는 화면 effect의 이벤트에는 공통 프로퍼티가 영영 붙지 않는다. 큐는 순서를 지킬 뿐
// 이미 합쳐진 props를 고쳐주지 않는다. 실제로 /login 첫 진입의 login_start가 `from`만 달고 나갔다.
// (/products는 Suspense 경계 덕에 우연히 순서가 맞아 정상이었다 — 타이밍에 기대면 안 되는 이유.)
// 두 함수는 모듈 변수에 값만 넣으므로 서버 평가에서도 안전하다.
registerProviders([consoleProvider]);
setCommonProperties(commonProperties);

// initAnalytics()만 effect에 남긴다 — 프로바이더 초기화는 브라우저에서 한 번만 돌아야 한다.
// 그 전에 쌓인 이벤트는 로거의 큐가 순서대로 흘려보낸다.
export function AnalyticsProvider() {
  useEffect(() => {
    void initAnalytics();
  }, []);

  return null;
}
