import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import { describe, expect, it, vi } from 'vitest';

import { ProductList } from '@/_pages/products/ui/ProductList';
import type { Product, ProductListResponse } from '@/entities/product';
import { productQueries } from '@/entities/product';
import { getProducts } from '@/entities/product/api/fetch-product';
import {
  loadProductListConditions,
  toProductListQuery,
} from '@/features/product';

vi.mock('@/entities/product/api/fetch-product', () => ({
  getHome: vi.fn(),
  getProducts: vi.fn(),
}));

const PRODUCT: Product = {
  id: 'p9',
  brand: 'Loopers Select',
  name: '오크 원형 사이드 테이블',
  category: 'home',
  price: 89000,
  originalPrice: null,
  image: '/images/products/p9.jpg',
  freeShipping: true,
  sizes: [],
  rating: 4.7,
  reviewCount: 128,
  createdAt: '2026-01-01T00:00:00.000Z',
};

const LIST_RESPONSE: ProductListResponse = {
  products: [PRODUCT],
  categories: [{ id: 'home', name: '홈' }],
  totalCount: 1,
  page: 1,
  pageSize: 12,
};

const defaultListQueryKey = async () =>
  productQueries.list(
    toProductListQuery(await loadProductListConditions(Promise.resolve(''))),
  ).queryKey;

function renderProductList(queryClient: QueryClient) {
  render(
    <NuqsTestingAdapter>
      <QueryClientProvider client={queryClient}>
        <ProductList />
      </QueryClientProvider>
    </NuqsTestingAdapter>,
  );
}

function createTestQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

describe('상품 목록 조회 실패 인라인 처리', () => {
  it('보여줄 데이터가 없는 실패는 에러 화면으로 처리하고 다시 시도로 복구한다', async () => {
    vi.mocked(getProducts).mockRejectedValue(
      new Error('상품 목록을 불러오지 못했습니다.'),
    );

    renderProductList(createTestQueryClient());

    const alert = await screen.findByRole('alert');

    expect(alert).toHaveTextContent('상품 목록을 불러오지 못했습니다.');
    expect(
      within(alert).getByRole('link', { name: '홈으로 가기' }),
    ).toBeInTheDocument();

    vi.mocked(getProducts).mockResolvedValue(LIST_RESPONSE);
    await userEvent.click(
      within(alert).getByRole('button', { name: '다시 시도' }),
    );

    expect(await screen.findByText('총 1개')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('보여줄 데이터가 있는 재조회 실패는 목록을 유지한 채 배너를 띄우고 다시 시도로 복구한다', async () => {
    vi.mocked(getProducts).mockRejectedValue(
      new Error('상품 목록을 불러오지 못했습니다.'),
    );

    const queryClient = createTestQueryClient();
    const queryKey = await defaultListQueryKey();

    queryClient.setQueryData(queryKey, LIST_RESPONSE);
    renderProductList(queryClient);

    expect(screen.getByText('총 1개')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    void queryClient.refetchQueries({ queryKey });

    const alert = await screen.findByRole('alert');

    expect(alert).toHaveTextContent('새 목록을 불러오지 못했습니다.');
    expect(screen.getByText('총 1개')).toBeInTheDocument();

    vi.mocked(getProducts).mockResolvedValue(LIST_RESPONSE);
    await userEvent.click(
      within(alert).getByRole('button', { name: '다시 시도' }),
    );

    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
    expect(screen.getByText('총 1개')).toBeInTheDocument();
  });
});
