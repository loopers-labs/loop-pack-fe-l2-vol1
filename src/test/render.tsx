import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { NuqsTestingAdapter, type OnUrlUpdateFunction } from "nuqs/adapters/testing";
import type { ReactNode } from "react";

// 테스트 전용 QueryClient. retry를 끈다 —
// 앱 기본값(retry: 1)이면 에러 케이스가 재시도를 기다리다 타임아웃 난다.
// staleTime은 앱과 같은 값을 둔다(캐시 동작이 달라지면 검증 대상이 달라진다).
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 60 * 1000 } },
  });
}

type RenderOptions = {
  /** 진입 시점의 URL 조건. 예: "?category=fashion&page=2" */
  searchParams?: string;
  /** URL이 갱신될 때마다 호출된다 — 조작이 URL에 반영되는지 관찰하는 자리. */
  onUrlUpdate?: OnUrlUpdateFunction;
};

// app/layout.tsx는 렌더하지 않는다 — next/font/google과 전역 CSS가 딸려 온다.
// 화면이 실제로 필요로 하는 경계(QueryClient · nuqs)만 세운다.
export function renderWithProviders(
  ui: ReactNode,
  { searchParams = "", onUrlUpdate }: RenderOptions = {},
) {
  const queryClient = createTestQueryClient();

  const result = render(
    <QueryClientProvider client={queryClient}>
      {/* hasMemory — 어댑터가 갱신된 조건을 기억한다.
          기본값(false)이면 setParams 뒤에도 조건이 초기값에 고정돼
          "카테고리를 바꾸면 목록이 바뀐다" 같은 검증이 성립하지 않는다. */}
      <NuqsTestingAdapter searchParams={searchParams} onUrlUpdate={onUrlUpdate} hasMemory>
        {ui}
      </NuqsTestingAdapter>
    </QueryClientProvider>,
  );

  return { ...result, queryClient };
}
