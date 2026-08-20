import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NuqsTestingAdapter, type UrlUpdateEvent } from 'nuqs/adapters/testing';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { ProductListPage } from './ProductListPage';
import type { ProductListResponse } from '@/entities/product/model';

const successResponse: ProductListResponse = {
  products: [],
  categories: [{ id: 'home', name: '홈' }],
  totalCount: 0,
  page: 1,
  pageSize: 12,
};

// onUrlUpdate 콜백을 직접 확인해야 하므로, 이 테스트만 별도로 provider를 구성함
function renderWithUrlSpy(onUrlUpdate: (event: UrlUpdateEvent) => void) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <NuqsTestingAdapter searchParams="" hasMemory onUrlUpdate={onUrlUpdate}>
        <ProductListPage />
      </NuqsTestingAdapter>
    </QueryClientProvider>,
  );
}

describe('ProductListPage — 조작이 URL에 반영 (항목 11)', () => {
  it('카테고리를 변경하면 URL 쿼리스트링에 category가 반영된다', async () => {
    server.use(
      http.get('/api/products', () => HttpResponse.json(successResponse)),
    );
    const onUrlUpdate = vi.fn<(event: UrlUpdateEvent) => void>();

    renderWithUrlSpy(onUrlUpdate);
    await screen.findByText('상품이 없습니다.');

    await userEvent.selectOptions(screen.getByLabelText('카테고리'), '패션');

    expect(onUrlUpdate).toHaveBeenCalled();
    const lastCall = onUrlUpdate.mock.calls.at(-1)?.[0];
    expect(lastCall?.searchParams.get('category')).toBe('fashion');
  });

  it('정렬을 변경하면 URL 쿼리스트링에 sort가 반영된다', async () => {
    server.use(
      http.get('/api/products', () => HttpResponse.json(successResponse)),
    );
    const onUrlUpdate = vi.fn<(event: UrlUpdateEvent) => void>();

    renderWithUrlSpy(onUrlUpdate);
    await screen.findByText('상품이 없습니다.');

    await userEvent.selectOptions(screen.getByLabelText('정렬'), '높은 가격순');

    expect(onUrlUpdate).toHaveBeenCalled();
    const lastCall = onUrlUpdate.mock.calls.at(-1)?.[0];
    expect(lastCall?.searchParams.get('sort')).toBe('price-desc');
  });
});