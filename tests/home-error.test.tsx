import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { HomeContent } from '@/_pages/home/ui/HomeContent';
import type { HomeResponse, Product } from '@/entities/product';
import { productQueries } from '@/entities/product';
import { getHome } from '@/entities/product/api/fetch-product';

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

const HOME_RESPONSE: HomeResponse = {
  banner: {
    title: '배너 제목',
    description: '배너 설명',
    image: '/banner.jpg',
  },
  categories: [{ id: 'home', name: '홈' }],
  popularProducts: [PRODUCT],
  newProducts: [],
};

function renderHome(queryClient: QueryClient) {
  render(
    <QueryClientProvider client={queryClient}>
      <HomeContent />
    </QueryClientProvider>,
  );
}

function createTestQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

describe('홈 조회 실패 인라인 처리', () => {
  it('보여줄 데이터가 없는 실패는 콘텐츠 영역 에러 화면으로 처리한다', async () => {
    vi.mocked(getHome).mockRejectedValue(
      new Error('홈 데이터를 불러오지 못했습니다.'),
    );

    renderHome(createTestQueryClient());

    const alert = await screen.findByRole('alert');

    expect(alert).toHaveTextContent('홈 데이터를 불러오지 못했습니다.');
    expect(
      within(alert).getByRole('button', { name: '다시 시도' }),
    ).toBeInTheDocument();
  });

  it('보여줄 데이터가 있는 재조회 실패는 화면을 유지하고 배너를 띄운다', async () => {
    vi.mocked(getHome).mockRejectedValue(
      new Error('홈 데이터를 불러오지 못했습니다.'),
    );

    const queryClient = createTestQueryClient();

    queryClient.setQueryData(productQueries.home().queryKey, HOME_RESPONSE);
    renderHome(queryClient);

    expect(
      screen.getByRole('heading', { name: '인기 상품' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    void queryClient.refetchQueries({
      queryKey: productQueries.home().queryKey,
    });

    const alert = await screen.findByRole('alert');

    expect(alert).toHaveTextContent('새 내용을 불러오지 못했습니다.');
    expect(
      within(alert).getByRole('button', { name: '다시 시도' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: '인기 상품' }),
    ).toBeInTheDocument();
  });
});
