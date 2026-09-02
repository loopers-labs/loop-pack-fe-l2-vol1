'use client';

import { useEffect, useRef } from 'react';
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

  useEffect(() => {
    registerProviders([consoleProvider]);
    setAnalyticsUserId(userId);
    setCommonProperties(getAnalyticsCommonProperties);

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
