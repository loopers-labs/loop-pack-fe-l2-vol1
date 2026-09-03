import { beforeEach, describe, expect, it } from 'vitest';
import { registerProviders } from '@/analytics/logger';
import {
  syncAnalyticsUser,
  trackLoginSuccess,
  trackProductListView,
} from '@/analytics/trackEvents';
import { SESSION_QUERY_KEY } from '@/entities/session/api/sessionQueryOptions';
import { getBrowserQueryClient } from './queryClient';
import type { AnalyticsProvider, EventProperties } from '@/analytics/provider';
import type { AuthUser } from '@/entities/session/model/session';

// 부트스트랩이 모듈 평가 시점에 계측을 준비한다. 이 테스트는 그 준비를 그대로 쓴다 —
// 가짜 reader를 끼우면 검사하려는 연결이 사라진다
import './analyticsBootstrap';

/**
 * 세션 캐시와 계측 사이의 연결을 고정한다.
 *
 * 계측 단위 테스트는 세션 상태를 변수로 흉내 내므로, 부트스트랩이 실제 QueryClient를 읽도록
 * 이어 붙였는지는 확인하지 못한다. 여기서는 서버가 심어 준 세션이 들어가는 그 캐시에 직접
 * 값을 넣고, 프로바이더가 받은 호출을 순서까지 본다.
 */

const LOGGED_IN_USER: AuthUser = { id: 'u1', name: '루퍼1', email: 'looper1@loopers.dev' };

type Call =
  | { kind: 'identify'; userId: string }
  | { kind: 'reset' }
  | { kind: 'track'; event: string; properties: EventProperties };

const calls: Call[] = [];

const captureProvider: AnalyticsProvider = {
  name: 'capture',
  initialize() {},
  track(event, properties) {
    calls.push({ kind: 'track', event, properties });
  },
  identify(userId) {
    calls.push({ kind: 'identify', userId });
  },
  reset() {
    calls.push({ kind: 'reset' });
  },
};

beforeEach(() => {
  // 부트스트랩이 이미 초기화를 끝냈으므로 프로바이더만 바꿔 끼운다
  registerProviders([captureProvider]);

  // 캐시도 "프로바이더에 마지막으로 알린 사용자"도 모듈에 남아 이 파일의 테스트가 공유한다.
  // 캐시만 비우면 알린 사용자는 이전 테스트의 값 그대로라, 다음 테스트에서 같은 사용자로 보여
  // identify가 나가지 않는다. 로그아웃 상태까지 맞춘 뒤에 기록을 비운다
  getBrowserQueryClient().setQueryData(SESSION_QUERY_KEY, null);
  syncAnalyticsUser();
  calls.length = 0;
});

describe('세션 캐시와 계측의 연결', () => {
  // 서버가 심어 준 세션은 이 캐시로 들어온다. 로그인 함수를 거치지 않는 경로다
  it('캐시에 로그인 세션이 있으면 첫 이벤트 앞에 identify가 오고 그 이벤트에 userId가 실린다', () => {
    getBrowserQueryClient().setQueryData(SESSION_QUERY_KEY, LOGGED_IN_USER);

    trackProductListView({ category: 'all', sort: 'latest', page: 1 });

    expect(calls).toEqual([
      { kind: 'identify', userId: 'u1' },
      {
        kind: 'track',
        event: 'product_list_view',
        properties: expect.objectContaining({ userId: 'u1' }),
      },
    ]);
  });

  // 로그인 mutation이 하는 일도 이 캐시를 채우는 것 하나다
  it('로그인이 캐시를 채운 뒤 보낸 login_success에 userId가 실린다', () => {
    getBrowserQueryClient().setQueryData(SESSION_QUERY_KEY, LOGGED_IN_USER);

    trackLoginSuccess('/orders');

    expect(calls).toEqual([
      { kind: 'identify', userId: 'u1' },
      {
        kind: 'track',
        event: 'login_success',
        properties: expect.objectContaining({ from: '/orders', userId: 'u1' }),
      },
    ]);
  });

  // 만료와 로그아웃이 캐시를 비운다
  it('캐시가 비면 다음 이벤트 앞에 reset이 오고 그 이벤트에는 userId가 없다', () => {
    getBrowserQueryClient().setQueryData(SESSION_QUERY_KEY, LOGGED_IN_USER);
    trackProductListView({ category: 'all', sort: 'latest', page: 1 });
    calls.length = 0;

    getBrowserQueryClient().setQueryData(SESSION_QUERY_KEY, null);
    trackProductListView({ category: 'all', sort: 'latest', page: 1 });

    expect(calls[0]).toEqual({ kind: 'reset' });
    expect(calls[1]).toMatchObject({ kind: 'track', event: 'product_list_view' });
    expect(calls[1]).toHaveProperty('properties');
    expect((calls[1] as { properties: EventProperties }).properties).not.toHaveProperty('userId');
  });
});
