import type { ComponentProps, ReactElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { render as rtlRender, type RenderResult } from "@testing-library/react";

type NuqsAdapterProps = ComponentProps<typeof NuqsTestingAdapter>;

type RenderOptions = Pick<NuqsAdapterProps, "searchParams" | "onUrlUpdate">;

type RenderResultWithQueryClient = RenderResult & { queryClient: QueryClient };

// 5주차 커머스 스위트 전체가 쓰는 테스트 렌더 헬퍼.
// hasMemory: true는 무조건 계약이다 — 꺼두면 nuqs 상태가 초기 URL로 동결되어
// 정렬·페이지네이션 조작이 렌더에 반영되지 않는다.
export function render(
  ui: ReactElement,
  { searchParams, onUrlUpdate }: RenderOptions = {},
): RenderResultWithQueryClient {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  const result = rtlRender(
    <QueryClientProvider client={queryClient}>
      <NuqsTestingAdapter hasMemory searchParams={searchParams} onUrlUpdate={onUrlUpdate}>
        {ui}
      </NuqsTestingAdapter>
    </QueryClientProvider>,
  );

  return { ...result, queryClient };
}
