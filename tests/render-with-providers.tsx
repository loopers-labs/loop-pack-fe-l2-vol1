import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NuqsTestingAdapter, type UrlUpdateEvent } from 'nuqs/adapters/testing';
import type { ReactNode } from 'react';
import { vi } from 'vitest';

type RenderWithProvidersOptions = {
  searchParams?: string;
  gcTime?: number;
  queryClient?: QueryClient;
};

/** 페이지급 통합 테스트가 앱과 같은 프로바이더(URL 상태, 서버 상태) 안에서 돌게 한다. */
export function renderWithProviders(
  ui: ReactNode,
  {
    searchParams = '',
    gcTime,
    queryClient: providedQueryClient,
  }: RenderWithProvidersOptions = {},
) {
  const queryClient =
    providedQueryClient ??
    new QueryClient({
      // 조회 실패를 확인하는 테스트가 재시도 백오프를 실제로 기다리지 않게
      defaultOptions: { queries: { retry: false, gcTime } },
    });
  // 진짜 라우터가 없으니 nuqs가 URL에 쓰려는 값은 이 콜백으로만 볼 수 있다
  const onUrlUpdate = vi.fn<(event: UrlUpdateEvent) => void>();

  const tree = (searchParams: string) => (
    // hasMemory가 없으면 검색 파라미터가 초기값에 얼어붙는다
    <NuqsTestingAdapter
      searchParams={searchParams}
      hasMemory
      onUrlUpdate={onUrlUpdate}
    >
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    </NuqsTestingAdapter>
  );
  const { rerender } = render(tree(searchParams));

  return {
    user: userEvent.setup(),
    queryClient,
    onUrlUpdate,
    // 뒤로 가기처럼 바깥에서 URL이 바뀐 상황. hasMemory면 어댑터가 새 searchParams를 URL로 동기화한다.
    // 단, 처음 넘긴 문자열과 같으면 어댑터가 변화를 못 보고 조용히 넘어가므로 막는다.
    navigate: (next: string) => {
      if (next === searchParams) {
        throw new Error(
          `처음 주소와 같은 '${next}'로는 이동을 흉내 낼 수 없다`,
        );
      }

      rerender(tree(next));
    },
  };
}
