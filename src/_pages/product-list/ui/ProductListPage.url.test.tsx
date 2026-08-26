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
  // 정상: 1) 카테고리를 변경하면 URL에 category가 반영됨
  //       2) 정렬을 변경하면 URL에 sort가 반영됨
  // 경계: 3) 카테고리와 정렬을 연속으로 바꾸면 URL에 두 값이 함께 반영됨(이전 값이 안 사라짐)
  //       4) 검색어를 입력하면(디바운스 후) URL에 q가 반영됨
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

  it('카테고리와 정렬을 연속으로 바꾸면 URL에 두 값이 함께 반영된다', async () => {
    server.use(
      http.get('/api/products', () => HttpResponse.json(successResponse)),
    );
    const onUrlUpdate = vi.fn<(event: UrlUpdateEvent) => void>();

    renderWithUrlSpy(onUrlUpdate);
    await screen.findByText('상품이 없습니다.');

    await userEvent.selectOptions(screen.getByLabelText('카테고리'), '패션');
    await userEvent.selectOptions(screen.getByLabelText('정렬'), '높은 가격순');

    const lastCall = onUrlUpdate.mock.calls.at(-1)?.[0];
    expect(lastCall?.searchParams.get('category')).toBe('fashion');
    expect(lastCall?.searchParams.get('sort')).toBe('price-desc');
  });

  it('검색어를 입력하면 디바운스 후 URL에 q가 반영된다', async () => {
    server.use(
      http.get('/api/products', () => HttpResponse.json(successResponse)),
    );
    const onUrlUpdate = vi.fn<(event: UrlUpdateEvent) => void>();

    renderWithUrlSpy(onUrlUpdate);
    await screen.findByText('상품이 없습니다.');

    await userEvent.type(screen.getByLabelText('검색'), '가디건');

    await vi.waitFor(() => {
      const lastCall = onUrlUpdate.mock.calls.at(-1)?.[0];
      expect(lastCall?.searchParams.get('q')).toBe('가디건');
    });
  });
});
