import type { ReactElement, ReactNode } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type RenderOptions, render } from '@testing-library/react';
import { AppRouterContext, type AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { NuqsTestingAdapter, type OnUrlUpdateFunction } from 'nuqs/adapters/testing';

type RenderWithProvidersOptions = Omit<RenderOptions, 'wrapper'> & {
  /** 진입 시점의 URL 조건. `?q=셔츠&page=2` 처럼 준다. */
  searchParams?: string | Record<string, string> | URLSearchParams;
  /** URL 이 갱신될 때 호출된다. 조작이 URL 에 실리는지 단언할 때 쓴다. */
  onUrlUpdate?: OnUrlUpdateFunction;
};

const noop = () => {};

/**
 * 렌더를 위한 no-op App Router.
 *
 * 테스트가 이 값을 갈아끼울 수 없게 두는 것이 의도다. jsdom 에서 이동은 일어나지 않으므로
 * "push 가 불렸다"는 단언은 사용자가 어디에 있게 되는지를 말해주지 않는다. 이동·히스토리·
 * 헤더 갱신은 4단계 E2E 가 브라우저에서 확인한다.
 */
const ROUTER_STUB: AppRouterInstance = {
  back: noop,
  forward: noop,
  refresh: noop,
  push: noop,
  replace: noop,
  prefetch: noop,
};

/**
 * 앱과 같은 Provider 구성으로 렌더한다. 단 세 가지가 다르다.
 *
 * 1. QueryClient 를 매 테스트마다 새로 만들고 `retry: false` 를 준다.
 *    앱의 getQueryClient() 는 싱글턴이라 캐시가 다음 테스트로 샌다. 그리고 앱 설정에는
 *    retry 지정이 없어 기본 3회 + 지수 백오프가 걸리는데, 그대로 두면 에러 경로 테스트가
 *    실패 확정까지 수 초를 기다리다 타임아웃 난다.
 *
 * 2. nuqs 는 Next 어댑터 대신 테스트 어댑터를 쓴다. searchParams 로 진입 조건을 주입하고
 *    onUrlUpdate 로 URL 갱신을 관측한다. 실제 history 스택은 쌓이지 않으므로
 *    뒤로/앞으로 가기는 여기서 검증할 수 없다 — 그건 E2E 의 몫이다.
 *
 * 3. App Router 를 context 로 세워 준다. jsdom 에는 라우터가 없어서 useRouter() 를 부르는
 *    컴포넌트는 이것 없이는 렌더 단계에서 "invariant expected app router to be mounted" 로 죽는다.
 *
 *    vi.mock('next/navigation') 대신 실물 Provider 를 세운다. 모듈 모킹은 그 모듈을 통째로
 *    갈아끼워서, 컴포넌트가 나중에 useSearchParams 를 쓰기 시작하면 undefined 가 되어 조용히 깨진다.
 *    import 경로가 next 내부라 메이저 업그레이드에서 옮겨갈 수 있는데, next/navigation 은 이
 *    context 를 공개하지 않아 다른 경로가 없고, 옮겨가면 import 에러로 크게 터진다.
 *
 *    스텁을 주입할 수단은 일부러 열어 두지 않았다. 이건 렌더를 가능하게 하는 런타임 의존성이지
 *    단언 장치가 아니다. 이동이 일어났는지는 jsdom 이 볼 수 없으므로 E2E 에서 확인한다.
 */
export function renderWithProviders(ui: ReactElement, options: RenderWithProvidersOptions = {}) {
  const { searchParams, onUrlUpdate, ...renderOptions } = options;

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <AppRouterContext.Provider value={ROUTER_STUB}>
      <QueryClientProvider client={queryClient}>
        <NuqsTestingAdapter searchParams={searchParams} onUrlUpdate={onUrlUpdate}>
          {children}
        </NuqsTestingAdapter>
      </QueryClientProvider>
    </AppRouterContext.Provider>
  );

  return { queryClient, ...render(ui, { wrapper, ...renderOptions }) };
}
