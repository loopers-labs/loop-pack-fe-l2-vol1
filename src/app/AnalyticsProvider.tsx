'use client';

import { useEffect } from 'react';
import { consoleProvider } from '@/analytics/consoleProvider';
import {
  initAnalytics,
  registerProviders,
  setCommonProperties,
} from '@/analytics/logger';
import { commonProperties } from '@/shared/analytics/common-properties';

// initAnalytics()는 여기 한 곳에서만 부른다 (RFC A절).
// 루트 레이아웃에 두므로 어떤 화면에서 시작해도 초기화가 되고, 그 전에 화면이 보낸 이벤트
// (예: 첫 렌더의 product_list_view)는 로거의 큐에 담겨 초기화 뒤 순서대로 나간다.
// 실제 분석 도구는 붙이지 않는다 — consoleProvider로 콘솔과 window.__analytics에서 확인한다.
export function AnalyticsProvider() {
  useEffect(() => {
    registerProviders([consoleProvider]);
    setCommonProperties(commonProperties);
    void initAnalytics();
  }, []);

  return null;
}
