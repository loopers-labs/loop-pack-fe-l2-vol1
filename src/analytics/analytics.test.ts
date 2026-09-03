import { beforeEach, describe, expect, it } from 'vitest';
import { initAnalytics, registerProviders, resetAnalyticsForTest, track } from './logger';
import { resetCurrentUserForTest } from './currentUser';
import { resetAnalyticsSetupForTest, setupAnalytics } from './setup';
import {
  syncAnalyticsUser,
  trackCartAdd,
  trackCategoryFilterChange,
  trackLoginFail,
  trackLoginStart,
  trackLoginSuccess,
  trackOrderComplete,
  trackOrderStart,
  trackPageChange,
  trackProductListView,
  trackSortChange,
  trackWishlistAdd,
} from './trackEvents';
import { LOGIN_FAIL_REASON } from './events';
import type { AnalyticsProvider, EventProperties } from './provider';

/**
 * 계측 계약을 고정한다. 근거는 `docs/rfc/week09-e2e-scope.md` A절에 있다.
 *
 * 진짜 프로바이더 대신 기록만 하는 가짜를 끼워 `identify()`·`reset()`이 실제로 불렸는지까지 본다.
 * production 빌드는 `console.info`를 제거해서 콘솔로는 그 둘을 관측할 수 없다.
 */

type Recorded = { event: string; properties: EventProperties };

function createCaptureProvider() {
  const tracked: Recorded[] = [];
  const identified: string[] = [];
  const resets: string[] = [];

  const provider: AnalyticsProvider = {
    name: 'capture',
    initialize() {},
    track(event, properties) {
      tracked.push({ event, properties });
    },
    identify(userId) {
      identified.push(userId);
    },
    reset() {
      resets.push('reset');
    },
  };

  return { provider, tracked, identified, resets };
}

/** 준비를 마치고 캡처용 프로바이더로 바꾼다 */
async function start() {
  const capture = createCaptureProvider();
  setupAnalytics({ readUserId: () => currentUserId });
  registerProviders([capture.provider]);
  await initAnalytics();
  return capture;
}

const last = (tracked: Recorded[]) => tracked[tracked.length - 1];

/**
 * 세션 상태를 대신한다.
 *
 * 실제로는 세션 쿼리 캐시를 읽는다. `identifyUser()`가 아니라 이 값이 `userId`를 결정하므로,
 * 새로고침이나 만료처럼 함수 호출 없이 상태만 바뀌는 경우를 여기서 재현한다.
 */
let currentUserId: string | null = null;

beforeEach(() => {
  resetAnalyticsForTest();
  resetAnalyticsSetupForTest();
  resetCurrentUserForTest();
  window.sessionStorage.clear();
  currentUserId = null;
});

describe('공통 프로퍼티', () => {
  it('초기화가 끝나기 전에 보낸 이벤트에도 공통 프로퍼티가 빠지지 않는다', async () => {
    const capture = createCaptureProvider();
    setupAnalytics({ readUserId: () => currentUserId });
    registerProviders([capture.provider]);

    // 아직 initAnalytics()가 끝나지 않아 큐에 쌓이는 시점
    trackCartAdd('p1');
    expect(capture.tracked).toHaveLength(0);

    await initAnalytics();

    expect(capture.tracked).toHaveLength(1);
    expect(last(capture.tracked).properties).toMatchObject({
      sessionId: expect.stringMatching(/^s_/),
      ts: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
      device: expect.any(String),
    });
  });

  it('같은 탭에서는 sessionId가 유지된다', async () => {
    const capture = await start();

    trackCartAdd('p1');
    trackWishlistAdd('p2');

    const ids = capture.tracked.map((row) => row.properties.sessionId);
    expect(new Set(ids).size).toBe(1);
  });

  it('viewport 너비로 device를 가른다', async () => {
    const capture = await start();

    trackCartAdd('p1');

    // jsdom 기본 폭은 1024라 desktop 구간에 든다
    expect(last(capture.tracked).properties.device).toBe('desktop');
  });
});

describe('userId와 프로바이더 사용자', () => {
  it('로그인 전에는 userId가 없고 프로바이더에도 알리지 않는다', async () => {
    const capture = await start();

    trackProductListView({ category: 'all', sort: 'latest', page: 1 });

    expect(last(capture.tracked).properties).not.toHaveProperty('userId');
    expect(capture.identified).toEqual([]);
  });

  it('로그인하면 userId가 붙고 그 이벤트보다 먼저 identify가 불린다', async () => {
    const capture = await start();

    currentUserId = 'u1';
    trackLoginSuccess('/orders/new');

    expect(capture.identified).toEqual(['u1']);
    expect(last(capture.tracked).properties.userId).toBe('u1');
  });

  // 새로고침하면 로그인 함수를 다시 거치지 않는다. identify를 로그인 성공에만 걸어 두면
  // 이벤트의 userId와 프로바이더가 아는 사용자가 갈린다
  it('로그인한 채로 새로고침해도 첫 이벤트에서 identify가 불린다', async () => {
    currentUserId = 'u1';
    const capture = await start();

    trackProductListView({ category: 'all', sort: 'latest', page: 1 });

    expect(capture.identified).toEqual(['u1']);
    expect(last(capture.tracked).properties.userId).toBe('u1');
  });

  it('같은 사용자로 이벤트를 여러 번 보내도 identify는 한 번만 불린다', async () => {
    currentUserId = 'u1';
    const capture = await start();

    trackProductListView({ category: 'all', sort: 'latest', page: 1 });
    trackCartAdd('p1');
    trackWishlistAdd('p2');

    expect(capture.identified).toEqual(['u1']);
  });

  // 만료는 로그아웃 버튼을 거치지 않는다. 이벤트의 userId만 지우고 프로바이더를 그대로 두면
  // 로그에는 사용자가 없는데 분석 도구 안에는 이전 사용자가 남는다
  it('세션이 만료되면 userId가 빠지고 프로바이더도 초기화된다', async () => {
    currentUserId = 'u1';
    const capture = await start();
    trackProductListView({ category: 'all', sort: 'latest', page: 1 });

    currentUserId = null;
    trackProductListView({ category: 'all', sort: 'latest', page: 1 });

    expect(capture.resets).toEqual(['reset']);
    expect(last(capture.tracked).properties).not.toHaveProperty('userId');
  });

  it('로그인하지 않은 상태의 로그인 실패에는 userId가 붙지 않는다', async () => {
    const capture = await start();

    trackLoginFail(LOGIN_FAIL_REASON.INVALID_CREDENTIALS);

    expect(capture.identified).toEqual([]);
    expect(last(capture.tracked).properties).not.toHaveProperty('userId');
  });

  // userId는 "이 이벤트 시점에 인증돼 있던 사용자"라 이벤트마다 예외를 두지 않는다.
  // 실패한 자격 증명의 주인을 가리키는 값이 아니다 (A-3)
  it('로그인한 사용자가 재로그인에 실패하면 그 사용자의 userId가 붙는다', async () => {
    currentUserId = 'u1';
    const capture = await start();

    trackLoginFail(LOGIN_FAIL_REASON.INVALID_CREDENTIALS);

    expect(last(capture.tracked).properties.userId).toBe('u1');
  });

  it('로그아웃하면 뒤따르는 이벤트가 없어도 프로바이더가 초기화된다', async () => {
    currentUserId = 'u1';
    const capture = await start();
    trackLoginSuccess('/orders/new');
    const sessionIdWhileLoggedIn = last(capture.tracked).properties.sessionId;

    currentUserId = null;
    syncAnalyticsUser();
    trackProductListView({ category: 'all', sort: 'latest', page: 1 });

    expect(capture.resets).toEqual(['reset']);
    expect(last(capture.tracked).properties).not.toHaveProperty('userId');
    expect(last(capture.tracked).properties.sessionId).toBe(sessionIdWhileLoggedIn);
  });
});

describe('이벤트별 프로퍼티', () => {
  it('A-4 계약과 같은 이름과 값으로 보낸다', async () => {
    const capture = await start();

    trackProductListView({ category: 'casual', sort: 'price-asc', page: 2 });
    trackCategoryFilterChange('goods');
    trackSortChange('popular');
    trackPageChange(3);
    trackCartAdd('p5');
    trackWishlistAdd('p7');
    trackLoginStart('/orders/new');
    trackLoginSuccess('/orders');
    trackLoginFail(LOGIN_FAIL_REASON.SERVER_ERROR);
    trackOrderStart(['p5', 'p7']);
    trackOrderComplete('o1', ['p5', 'p7']);

    const shape = capture.tracked.map(({ event, properties }) => {
      const { sessionId: _s, ts: _t, device: _d, ...rest } = properties;
      return { event, rest };
    });

    expect(shape).toEqual([
      { event: 'product_list_view', rest: { category: 'casual', sort: 'price-asc', page: 2 } },
      { event: 'category_filter_change', rest: { category: 'goods' } },
      { event: 'sort_change', rest: { sort: 'popular' } },
      { event: 'page_change', rest: { page: 3 } },
      { event: 'cart_add', rest: { productId: 'p5', quantity: 1 } },
      { event: 'wishlist_add', rest: { productId: 'p7' } },
      { event: 'login_start', rest: { from: '/orders/new' } },
      { event: 'login_success', rest: { from: '/orders' } },
      { event: 'login_fail', rest: { reason: 'SERVER_ERROR' } },
      { event: 'order_start', rest: { productIds: ['p5', 'p7'], itemCount: 2 } },
      {
        event: 'order_complete',
        rest: { orderId: 'o1', productIds: ['p5', 'p7'], itemCount: 2 },
      },
    ]);
  });

  it('시드 스키마에 없는 값은 담지 않는다', async () => {
    const capture = await start();

    trackCartAdd('p5');
    trackOrderComplete('o1', ['p5']);

    const allKeys = capture.tracked.flatMap((row) => Object.keys(row.properties));
    expect(allKeys).not.toContain('price');
    expect(allKeys).not.toContain('totalPrice');
  });
});

describe('로거를 거치지 않는 이름은 쓰지 않는다', () => {
  it('track에 직접 넘긴 이름도 공통 프로퍼티를 받는다', async () => {
    const capture = await start();

    track('product_list_view', { category: 'all', sort: 'latest', page: 1 });

    expect(last(capture.tracked).properties).toHaveProperty('sessionId');
  });
});
