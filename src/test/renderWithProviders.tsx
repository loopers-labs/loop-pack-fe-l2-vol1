import type { ReactElement, ReactNode } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type RenderOptions, render } from '@testing-library/react';
import { NuqsTestingAdapter, type OnUrlUpdateFunction } from 'nuqs/adapters/testing';

type RenderWithProvidersOptions = Omit<RenderOptions, 'wrapper'> & {
  /** 진입 시점의 URL 조건. `?q=셔츠&page=2` 처럼 준다. */
  searchParams?: string | Record<string, string> | URLSearchParams;
  /** URL 이 갱신될 때 호출된다. 조작이 URL 에 실리는지 단언할 때 쓴다. */
  onUrlUpdate?: OnUrlUpdateFunction;
};

/**
 * 앱과 같은 Provider 구성으로 렌더한다. 단 두 가지가 다르다.
 *
 * 1. QueryClient 를 매 테스트마다 새로 만들고 `retry: false` 를 준다.
 *    앱의 getQueryClient() 는 싱글턴이라 캐시가 다음 테스트로 샌다. 그리고 앱 설정에는
 *    retry 지정이 없어 기본 3회 + 지수 백오프가 걸리는데, 그대로 두면 에러 경로 테스트가
 *    실패 확정까지 수 초를 기다리다 타임아웃 난다.
 *
 * 2. nuqs 는 Next 어댑터 대신 테스트 어댑터를 쓴다. searchParams 로 진입 조건을 주입하고
 *    onUrlUpdate 로 URL 갱신을 관측한다. 실제 history 스택은 쌓이지 않으므로
 *    뒤로/앞으로 가기는 여기서 검증할 수 없다 — 그건 E2E 의 몫이다.
 */
export function renderWithProviders(ui: ReactElement, options: RenderWithProvidersOptions = {}) {
  const { searchParams, onUrlUpdate, ...renderOptions } = options;

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <NuqsTestingAdapter searchParams={searchParams} onUrlUpdate={onUrlUpdate}>
        {children}
      </NuqsTestingAdapter>
    </QueryClientProvider>
  );

  return { queryClient, ...render(ui, { wrapper, ...renderOptions }) };
}
