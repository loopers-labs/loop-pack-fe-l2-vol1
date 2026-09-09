import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import type { PropsWithChildren } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { server } from '../../../../test/msw/server';
import { sessionQueryOptions } from './sessionQueryOptions';

/**
 * 세션 표시를 정정할 계기가 있는지 본다.
 *
 * 만료를 알려주는 것이 보호 경로 요청의 401뿐이면 그 요청은 보호 화면에서만 나가므로,
 * 홈이나 목록에 머무는 동안에는 화면이 로그인 상태로 남는다. 포커스 복귀에 재조회가
 * 걸리는지와, 그 전에는 요청이 나가지 않는지를 함께 고정한다.
 */

const LOGGED_IN = { id: 'u1', name: '루퍼1', email: 'looper1@loopers.dev' };

/** 재조회가 일어났다면 끝났을 만큼만 기다린다 */
const SETTLE_MS = 50;

/** staleTime(60초)을 막 넘긴 값 */
const STALE_AFTER_MS = 61_000;

let meCallCount = 0;

function useSession() {
  return useQuery(sessionQueryOptions());
}

/**
 * 신선한 값으로 심고 마운트한다.
 *
 * 오래된 값으로 마운트하면 기본 마운트 재조회가 먼저 돌아, 뒤이은 포커스 이벤트와 무관하게
 * 단언이 충족된다. 마운트를 신선한 상태로 지나간 뒤 값만 낡게 만들어야 포커스가 계기였음이
 * 갈린다.
 */
function renderSession(seeded: unknown) {
  const queryClient = new QueryClient();
  queryClient.setQueryData(['session'], seeded);
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  /** 마운트 뒤에 값만 낡게 만든다. setQueryData는 재조회를 트리거하지 않는다 */
  const age = () =>
    queryClient.setQueryData(['session'], seeded, { updatedAt: Date.now() - STALE_AFTER_MS });

  return { ...renderHook(() => useSession(), { wrapper }), age };
}

function dispatchFocus() {
  window.dispatchEvent(new Event('visibilitychange'));
  document.dispatchEvent(new Event('visibilitychange'));
  window.dispatchEvent(new Event('focus'));
}

beforeEach(() => {
  meCallCount = 0;
  server.use(
    http.get('*/api/auth/me', () => {
      meCallCount += 1;
      return HttpResponse.json({ message: '로그인이 필요합니다.' }, { status: 401 });
    }),
  );
});

describe('세션 표시 정정', () => {
  // 서버가 심은 값은 방금 만들어진 것이라 신선하다. 홈 cold load에 지연 요청을 얹지 않는다
  it('서버가 심은 값이 있으면 마운트 직후에 다시 묻지 않는다', async () => {
    const { result } = renderSession(LOGGED_IN);

    await waitFor(() => expect(result.current.data).toEqual(LOGGED_IN));
    expect(meCallCount).toBe(0);
  });

  // 약속하는 범위를 좁혀 둔다. staleTime은 다시 물어봐도 되는 시점만 정하고 스스로 부르지 않는다
  it('값이 신선하면 포커스가 돌아와도 다시 묻지 않는다', async () => {
    const { result } = renderSession(LOGGED_IN);
    await waitFor(() => expect(result.current.data).toEqual(LOGGED_IN));

    dispatchFocus();

    await new Promise((resolve) => setTimeout(resolve, SETTLE_MS));
    expect(meCallCount).toBe(0);
    expect(result.current.data).toEqual(LOGGED_IN);
  });

  // 자리를 비운 사이 세션이 끊겼을 수 있다. 돌아오는 순간이 정정 계기다
  it('값이 오래된 뒤 포커스가 돌아오면 다시 물어보고 끊긴 세션을 null로 정정한다', async () => {
    const { result, age } = renderSession(LOGGED_IN);
    await waitFor(() => expect(result.current.data).toEqual(LOGGED_IN));
    age();

    // 값이 낡았어도 계기가 없으면 그대로다
    await new Promise((resolve) => setTimeout(resolve, SETTLE_MS));
    expect(meCallCount).toBe(0);

    dispatchFocus();

    await waitFor(() => expect(result.current.data).toBeNull());
    expect(meCallCount).toBe(1);
  });
});
