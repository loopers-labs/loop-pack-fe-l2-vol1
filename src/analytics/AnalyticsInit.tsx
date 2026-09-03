'use client';

import { useEffect } from 'react';
import { consoleProvider } from './consoleProvider';
import { getCommonProperties } from './commonProperties';
import { initAnalytics, registerProviders, setCommonProperties } from './logger';

export const AnalyticsInit = () => {
  useEffect(() => {
    registerProviders([consoleProvider]);
    setCommonProperties(getCommonProperties);
    initAnalytics();
  }, []);

  return null;
};
