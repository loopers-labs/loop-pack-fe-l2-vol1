import type { ReactElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, type RenderResult } from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
import {
  NuqsTestingAdapter,
  type OnUrlUpdateFunction,
} from 'nuqs/adapters/testing'
import { ProductListPage } from '@/_pages/product-list'
import { HeaderActions } from '@/widgets/header'

interface RenderProductListOptions {
  searchParams?: string
  onUrlUpdate?: OnUrlUpdateFunction
  includeHeader?: boolean
}

interface RenderProductListResult extends RenderResult {
  queryClient: QueryClient
  user: UserEvent
}

export function renderProductList({
  searchParams = '',
  onUrlUpdate,
  includeHeader = false,
}: RenderProductListOptions = {}): RenderProductListResult {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
  const content: ReactElement = (
    <QueryClientProvider client={queryClient}>
      <NuqsTestingAdapter
        searchParams={searchParams}
        onUrlUpdate={onUrlUpdate}
        hasMemory
      >
        {includeHeader && <HeaderActions userName={null} />}
        <ProductListPage />
      </NuqsTestingAdapter>
    </QueryClientProvider>
  )

  return {
    ...render(content),
    queryClient,
    user: userEvent.setup(),
  }
}
