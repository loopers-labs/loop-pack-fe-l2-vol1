import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AnalyticsProvider } from '@/analytics/provider';
import {
  initAnalytics,
  registerProviders,
  resetAnalyticsForTest,
  setCommonProperties,
} from '@/analytics/logger';
import { analyticsEvents } from './events';

// 검증 대상: 문서(RFC A절)에 적은 이름·props로 나가는지, 그리고 "로그인 → 주문" 한 번에
// 어떤 이벤트가 어떤 순서로 남는지 — 2단계 완료 조건을 그대로 코드로 고정한다.
describe('analyticsEvents', () => {
  const sent: Array<{ event: string; properties: Record<string, unknown> }> =
    [];
  const identified: string[] = [];
  let resets = 0;

  const fakeProvider: AnalyticsProvider = {
    name: 'fake',
    initialize: () => {},
    track: (event, properties) => {
      sent.push({ event, properties });
    },
    identify: (userId) => {
      identified.push(userId);
    },
    reset: () => {
      resets += 1;
    },
  };

  beforeEach(async () => {
    sent.length = 0;
    identified.length = 0;
    resets = 0;
    resetAnalyticsForTest();
    registerProviders([fakeProvider]);
    setCommonProperties(() => ({ sessionId: 's_test', device: 'desktop' }));
    await initAnalytics();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('로그인부터 주문까지 한 번 지나가면 문서에 적은 순서대로 남는다', () => {
    analyticsEvents.productListView({
      category: 'all',
      sort: 'latest',
      page: 1,
    });
    analyticsEvents.cartAdd('p3');
    analyticsEvents.loginStart('/checkout');
    analyticsEvents.loginSuccess('u1', '/checkout');
    analyticsEvents.orderStart(1);
    analyticsEvents.orderComplete('o1', 1);
    analyticsEvents.logout();

    expect(sent.map((entry) => entry.event)).toEqual([
      'product_list_view',
      'cart_add',
      'login_start',
      'login_success',
      'order_start',
      'order_complete',
    ]);
    expect(identified).toEqual(['u1']);
    expect(resets).toBe(1);
  });

  it('공통 프로퍼티가 모든 이벤트에 붙고, 이벤트 props가 그 위에 얹힌다', () => {
    analyticsEvents.cartAdd('p7');

    expect(sent[0]).toEqual({
      event: 'cart_add',
      properties: {
        sessionId: 's_test',
        device: 'desktop',
        productId: 'p7',
        quantity: 1,
      },
    });
  });

  it('로그인 실패 이유는 정해진 두 값 중 하나로만 나간다', () => {
    analyticsEvents.loginFail('INVALID_CREDENTIALS');
    analyticsEvents.loginFail('SERVER_ERROR');

    expect(sent.map((entry) => entry.properties.reason)).toEqual([
      'INVALID_CREDENTIALS',
      'SERVER_ERROR',
    ]);
  });
});
