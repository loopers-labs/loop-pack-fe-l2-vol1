'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';
import { consoleProvider } from '@/analytics/consoleProvider';
import { getAnalyticsCommonProperties, setAnalyticsUserId } from '@/analytics/context';
import { identifyAnalyticsUser } from '@/analytics/events';
import {
  initAnalytics,
  registerProviders,
  setCommonProperties,
} from '@/analytics/logger';

interface AnalyticsInitializerProps {
  userId: string | null;
}

export function AnalyticsInitializer({ userId }: AnalyticsInitializerProps) {
  const identifiedUserId = useRef<string | null>(null);

  // layout effect는 모든 page-view passive effect보다 먼저 끝난다.
  // render 순수성을 유지하면서 최초 이벤트 전에 동기 배선을 완료한다.
  useLayoutEffect(() => {
    registerProviders([consoleProvider]);
    setAnalyticsUserId(userId);
    setCommonProperties(getAnalyticsCommonProperties);
  }, [userId]);

  useEffect(() => {
    if (userId && identifiedUserId.current !== userId) {
      identifyAnalyticsUser(userId);
      identifiedUserId.current = userId;
    } else if (!userId) {
      identifiedUserId.current = null;
    }

    void initAnalytics();
  }, [userId]);

  return null;
}
