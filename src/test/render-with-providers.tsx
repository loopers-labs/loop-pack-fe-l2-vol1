import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';

/**
 * 통합 테스트용 렌더 헬퍼.
 * - QueryClient는 테스트마다 새로 만들어 캐시가 다음 테스트로 새지 않게 함
 * - retry: false로 에러가 즉시 반영되게 함 (재시도 대기로 테스트가 느려지거나
 *   타임아웃 나는 것을 방지)
 * - nuqs는 실제 브라우저 URL 대신 NuqsTestingAdapter로 URL 상태를 흉내냄.
 *   searchParams로 테스트 시작 시점의 URL 쿼리스트링을 지정할 수 있음
 */
export function renderWithProviders(
  ui: ReactElement,
  { searchParams = '' }: { searchParams?: string } = {},
) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <NuqsTestingAdapter searchParams={searchParams} hasMemory>
        {ui}
      </NuqsTestingAdapter>
    </QueryClientProvider>,
  );
}