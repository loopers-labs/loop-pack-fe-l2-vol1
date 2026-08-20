import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';

import { ProductList } from '@/_pages/products/ui/ProductList';
import { ProductListFilters } from '@/features/product';

/** 목록만 그리면 조건을 바꿀 수단이 화면에 없어 필터를 함께 그린다. */
export function renderProductList(searchParams = '') {
  const queryClient = new QueryClient({
    // 조회 실패를 확인하는 테스트가 재시도 백오프를 실제로 기다리지 않게
    defaultOptions: { queries: { retry: false } },
  });

  render(
    // hasMemory가 없으면 검색 파라미터가 초기값에 얼어붙는다
    <NuqsTestingAdapter searchParams={searchParams} hasMemory>
      <QueryClientProvider client={queryClient}>
        <ProductListFilters />
        <ProductList />
      </QueryClientProvider>
    </NuqsTestingAdapter>,
  );

  return { user: userEvent.setup(), queryClient };
}
