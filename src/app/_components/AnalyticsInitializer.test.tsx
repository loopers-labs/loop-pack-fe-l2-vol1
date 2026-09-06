// @vitest-environment jsdom

import '@/test/setupDom';
import { useEffect } from 'react';
import { render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  resetAnalyticsContextForTest,
} from '@/analytics/context';
import { trackProductListView } from '@/analytics/events';
import { resetAnalyticsForTest } from '@/analytics/logger';
import { AnalyticsInitializer } from './AnalyticsInitializer';

function ImmediatePageView() {
  useEffect(() => {
    trackProductListView({ category: 'all', sort: 'latest', page: 1 });
  }, []);

  return null;
}

describe('AnalyticsInitializer', () => {
  beforeEach(() => {
    sessionStorage.clear();
    resetAnalyticsContextForTest();
    resetAnalyticsForTest();
    window.__analytics = undefined;
    vi.spyOn(console, 'info').mockImplementation(() => {});
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 390,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('page-view effect가 먼저 있어도 최초 이벤트에 공통 프로퍼티를 붙인다', async () => {
    render(
      <>
        <ImmediatePageView />
        <AnalyticsInitializer userId="u1" />
      </>,
    );

    await waitFor(() => {
      expect(window.__analytics).toHaveLength(1);
    });
    expect(window.__analytics?.[0]).toMatchObject({
      event: 'product_list_view',
      properties: {
        sessionId: expect.stringMatching(/^s_/),
        device: 'mobile',
        userId: 'u1',
        category: 'all',
        sort: 'latest',
        page: 1,
      },
    });
  });
});
