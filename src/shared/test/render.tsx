import { render as rtlRender } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  NuqsTestingAdapter,
  type OnUrlUpdateFunction,
} from 'nuqs/adapters/testing';
import type { ReactElement, ReactNode } from 'react';
import { createAppQueryClient } from '@/shared/api/query-client';

type RenderOptions = {
  // 재진입 검증용 — 이 쿼리스트링을 들고 화면에 들어온 것으로 렌더한다.
  searchParams?: string;
  // 조작이 URL에 반영되는지 확인할 때 스파이를 연결한다.
  onUrlUpdate?: OnUrlUpdateFunction;
};

// 테스트가 만든 QueryClient들 — 끝난 뒤 남은 요청을 정리하기 위해 들고 있는다.
const testQueryClients = new Set<QueryClient>();

// 실패 경로 테스트는 재시도(1회·1초 지연)를 예약해 둔 채 끝난다. 그 요청이 파일의
// afterAll(server.close()) 이후에 도착하면 테스트는 전부 통과했는데 파일만 실패로 잡힌다.
// 매 테스트 끝에 진행 중인 요청과 예약된 재시도를 취소하고 캐시를 비운다.
export async function clearTestQueryClients() {
  for (const queryClient of testQueryClients) {
    await queryClient.cancelQueries();
    queryClient.clear();
  }
  testQueryClients.clear();
}

// 화면과 같은 쿼리 정책(createAppQueryClient)을 쓴다 — 테스트만의 정책을 만들면
// retry·throwOnError가 달라져 실제 화면과 다른 실패 경로를 검증하게 된다.
// QueryClient는 호출마다 새로 만들어 캐시가 테스트 사이에 새지 않게 한다.
export function renderWithProviders(
  ui: ReactElement,
  { searchParams = '', onUrlUpdate }: RenderOptions = {},
) {
  const queryClient = createAppQueryClient();
  testQueryClients.add(queryClient);

  function Providers({ children }: { children: ReactNode }) {
    return (
      <NuqsTestingAdapter
        searchParams={searchParams}
        onUrlUpdate={onUrlUpdate}
        hasMemory
      >
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </NuqsTestingAdapter>
    );
  }

  return { queryClient, ...rtlRender(ui, { wrapper: Providers }) };
}
