import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { NuqsTestingAdapter, type OnUrlUpdateFunction } from "nuqs/adapters/testing";
import { Component, type ReactNode } from "react";
import { vi } from "vitest";

// 테스트 전용 QueryClient. retry를 끈다 —
// 앱 기본값(retry: 1)이면 에러 케이스가 재시도를 기다리다 타임아웃 난다.
// staleTime은 앱과 같은 값을 둔다(캐시 동작이 달라지면 검증 대상이 달라진다).
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 60 * 1000 } },
  });
}

// 5xx가 경계로 전파되는 것을 확인하는 자리.
// 통합 테스트는 app/products/error.tsx(라우트 경계)를 렌더하지 않으므로,
// 같은 역할의 경계를 테스트가 직접 세워 fallback이 뜨는 것으로 전파를 본다.
// 400만 검증하면 throwOnError를 () => false로 바꿔도 초록불이라 이게 필요하다.
export const BOUNDARY_FALLBACK = "경계가 오류를 받았습니다";

type BoundaryProps = { children: ReactNode };
type BoundaryState = { failed: boolean };

export class TestErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { failed: false };

  static getDerivedStateFromError(): BoundaryState {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return <p role="alert">{BOUNDARY_FALLBACK}</p>;
    }
    return this.props.children;
  }
}

// 라우터를 `vi.mock("next/navigation")`으로 만들지 않는다. 내부 모듈을 바꿔치기하면
// 화면이 실제로 무엇을 부르는지 검증에서 빠진다(false green). 대신 Next가 쓰는 것과
// **같은 컨텍스트**를 테스트가 세우고, 그 안에 관찰 가능한 대역을 넣는다.
// 그래서 "로그아웃하면 홈으로 보낸다" 같은 것을 spy로 단언할 수 있다.
export function createRouterSpy() {
  return {
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  };
}

export type RouterSpy = ReturnType<typeof createRouterSpy>;

type RenderOptions = {
  /** 진입 시점의 URL 조건. 예: "?category=fashion&page=2" */
  searchParams?: string;
  /** URL이 갱신될 때마다 호출된다 — 조작이 URL에 반영되는지 관찰하는 자리. */
  onUrlUpdate?: OnUrlUpdateFunction;
  /** 넘기지 않으면 새로 만든다. 넘기면 이동 호출을 단언할 수 있다. */
  router?: RouterSpy;
};

// app/layout.tsx는 렌더하지 않는다 — next/font/google과 전역 CSS가 딸려 온다.
// 화면이 실제로 필요로 하는 경계(QueryClient · nuqs)만 세운다.
export function renderWithProviders(
  ui: ReactNode,
  { searchParams = "", onUrlUpdate, router = createRouterSpy() }: RenderOptions = {},
) {
  const queryClient = createTestQueryClient();

  const result = render(
    <QueryClientProvider client={queryClient}>
      {/* hasMemory — 어댑터가 갱신된 조건을 기억한다.
          기본값(false)이면 setParams 뒤에도 조건이 초기값에 고정돼
          "카테고리를 바꾸면 목록이 바뀐다" 같은 검증이 성립하지 않는다. */}
      <NuqsTestingAdapter searchParams={searchParams} onUrlUpdate={onUrlUpdate} hasMemory>
        <AppRouterContext.Provider value={router}>{ui}</AppRouterContext.Provider>
      </NuqsTestingAdapter>
    </QueryClientProvider>,
  );

  return { ...result, queryClient, router };
}
