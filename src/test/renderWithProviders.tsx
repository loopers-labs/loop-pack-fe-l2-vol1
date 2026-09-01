import type { ReactElement } from 'react'
import { render } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// 인증 화면은 React Query 위에서 돈다. 테스트마다 Provider를 다시 쓰지 않도록 여기 둔다.
// 재시도는 끈다. 401·500을 확인하는 테스트가 재시도만큼 늦어진다.
export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0 },
      mutations: { retry: false },
    },
  })

export const renderWithProviders = (ui: ReactElement) => {
  const queryClient = createTestQueryClient()

  return {
    queryClient,
    ...render(
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
    ),
  }
}
