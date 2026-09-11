import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, type RenderOptions } from '@testing-library/react'
import {
  AppRouterContext,
  type AppRouterInstance,
} from 'next/dist/shared/lib/app-router-context.shared-runtime'
import { NuqsTestingAdapter } from 'nuqs/adapters/testing'
import type { ReactNode } from 'react'

type RenderWithProvidersOptions = Omit<RenderOptions, 'wrapper'> & {
  searchParams?: string | Record<string, string> | URLSearchParams
}

// useRouter는 App Router가 세운 context를 찾고, 없으면 렌더가 통째로 죽는다("invariant expected
// app router to be mounted"). 화면 조각을 떼어 그리는 테스트에는 그 context가 없으므로 여기서 세운다.
// 아무것도 하지 않는 stub인 것은 의도다 — 이동 자체가 검증 대상이면 그 테스트에서 next/navigation을
// mock 해 호출을 관찰한다. 여기 있는 것은 "라우터가 없어서 못 그린다"만 막는 최소한이다.
//
// next/dist 경로는 Next 내부다. 공개 API로 같은 context를 세울 방법이 없어 감수한다.
const testRouter: AppRouterInstance = {
  back: () => {},
  forward: () => {},
  refresh: () => {},
  prefetch: () => {},
  push: () => {},
  replace: () => {},
}

export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Number.POSITIVE_INFINITY },
      mutations: { retry: false },
    },
  })

export const renderWithProviders = (
  ui: ReactNode,
  { searchParams, ...renderOptions }: RenderWithProvidersOptions = {},
) => {
  const queryClient = createTestQueryClient()

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AppRouterContext.Provider value={testRouter}>
        <NuqsTestingAdapter searchParams={searchParams} hasMemory>
          {children}
        </NuqsTestingAdapter>
      </AppRouterContext.Provider>
    </QueryClientProvider>
  )

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}
