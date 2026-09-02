// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getAnalyticsCommonProperties,
  resetAnalyticsContextForTest,
} from './context';
import {
  getLoginFailureReason,
  identifyAnalyticsUser,
  resetAnalyticsUser,
  trackCartAdd,
  trackLoginStart,
  trackLoginSuccess,
  trackOrderComplete,
  trackOrderStart,
  trackProductDetailView,
  trackProductListView,
} from './events';
import { getLoginFrom, getLoginFromPathname } from '@/shared/lib/loginFrom';
import {
  initAnalytics,
  registerProviders,
  resetAnalyticsForTest,
  setCommonProperties,
} from './logger';
import type { AnalyticsProvider, EventProperties } from './provider';

type RecordedCall =
  | { type: 'track'; event: string; properties: EventProperties }
  | { type: 'identify'; userId: string }
  | { type: 'reset' };

function createRecorder() {
  const calls: RecordedCall[] = [];
  const provider: AnalyticsProvider = {
    name: 'recorder',
    initialize: () => {},
    track: (event, properties) =>
      calls.push({ type: 'track', event, properties }),
    identify: (userId) => calls.push({ type: 'identify', userId }),
    reset: () => calls.push({ type: 'reset' }),
  };

  return { calls, provider };
}

describe('analytics events', () => {
  beforeEach(() => {
    sessionStorage.clear();
    resetAnalyticsContextForTest();
    resetAnalyticsForTest();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-02T03:00:00.000Z'));
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 390,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('시드와 합의한 이벤트 이름과 공통 프로퍼티를 순서대로 보낸다', async () => {
    const { calls, provider } = createRecorder();
    registerProviders([provider]);
    setCommonProperties(getAnalyticsCommonProperties);
    await initAnalytics();

    trackProductListView({ category: 'all', sort: 'latest', page: 1 });
    trackProductDetailView('p1');
    trackCartAdd('p1');
    trackLoginStart('cart');
    identifyAnalyticsUser('u1');
    trackLoginSuccess('cart');
    trackOrderStart({
      productIds: ['p1'],
      itemCount: 2,
      totalPrice: 80_000,
    });
    trackOrderComplete({
      orderId: 'o1',
      productIds: ['p1'],
      itemCount: 2,
      totalPrice: 80_000,
    });
    resetAnalyticsUser();
    trackProductListView({ category: 'all', sort: 'latest', page: 1 });

    const tracked = calls.filter(
      (call): call is Extract<RecordedCall, { type: 'track' }> =>
        call.type === 'track',
    );
    const sessionIds = new Set(
      tracked.map((call) => call.properties.sessionId),
    );

    expect(tracked.map((call) => call.event)).toEqual([
      'product_list_view',
      'product_detail_view',
      'cart_add',
      'login_start',
      'login_success',
      'order_start',
      'order_complete',
      'product_list_view',
    ]);
    expect(sessionIds.size).toBe(1);
    expect(tracked[0]?.properties).toMatchObject({
      sessionId: expect.stringMatching(/^s_/),
      ts: '2026-09-02T03:00:00.000Z',
      device: 'mobile',
      category: 'all',
      sort: 'latest',
      page: 1,
    });
    expect(tracked[4]?.properties).toMatchObject({
      userId: 'u1',
      from: 'cart',
    });
    expect(tracked[6]?.properties).toMatchObject({
      userId: 'u1',
      orderId: 'o1',
      productIds: ['p1'],
      itemCount: 2,
      totalPrice: 80_000,
    });
    expect(tracked[7]?.properties).not.toHaveProperty('userId');
    expect(calls).toContainEqual({ type: 'identify', userId: 'u1' });
    expect(calls).toContainEqual({ type: 'reset' });
  });

  it('외부 입력과 이전 화면을 제한된 로그인 출처로 바꾼다', () => {
    expect(getLoginFrom('cart')).toBe('cart');
    expect(getLoginFrom('orders')).toBe('orders');
    expect(getLoginFrom('unknown')).toBe('direct');
    expect(getLoginFromPathname('/cart')).toBe('cart');
    expect(getLoginFromPathname('/orders/new')).toBe('orders');
    expect(getLoginFromPathname('/products')).toBe('direct');
    expect(getLoginFailureReason(401)).toBe('INVALID_CREDENTIALS');
    expect(getLoginFailureReason(400)).toBe('INVALID_REQUEST');
    expect(getLoginFailureReason(500)).toBe('SERVER_ERROR');
    expect(getLoginFailureReason()).toBe('UNKNOWN_ERROR');
  });
});
