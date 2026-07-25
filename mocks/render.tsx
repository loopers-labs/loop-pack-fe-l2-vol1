import type { ComponentProps, ReactElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { render as rtlRender, type RenderResult } from "@testing-library/react";

// 커머스 스위트는 @testing-library/react를 여기서만 가져온다(docs/testing/conventions.md:42
// 커스텀 render 처방) — 전체 re-export 구문은 eslint.config.mjs의 배럴 규칙(ExportAllDeclaration
// 금지, named re-export 지시)에 걸려 쓸 수 없으므로 실제로 쓰는 이름만 명시한다. 새 이름이
// 필요해지면 이 목록에 추가한다. render는 아래 로컬 커스텀 구현이라 여기 넣지 않는다(이름 충돌).
export { cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react";

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
