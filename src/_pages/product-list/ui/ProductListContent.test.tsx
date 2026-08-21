// @vitest-environment jsdom

import '@/test/setupDom';
import '@/test/setupMsw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, delay, http } from 'msw';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { HeaderNav } from '@/app/_components/HeaderNav';
import { useCartStore } from '@/entities/cart/model/cartStore';
import type {
  Product,
  ProductListResponse,
} from '@/entities/product/model/types';
import { useWishlistStore } from '@/entities/wishlist/model/wishlistStore';
import { productListFixture } from '@/test/msw/fixtures';
import { server } from '@/test/msw/server';
import { ProductListContent } from './ProductListContent';

const categories = productListFixture.categories;

function makeProduct(id: string, name: string, price = 39000): Product {
  return {
    ...productListFixture.products[0],
    id,
    name,
    price,
  };
}

function makeResponse(
  products: Product[],
  options: Partial<Pick<ProductListResponse, 'page' | 'pageSize' | 'totalCount'>> = {},
): ProductListResponse {
  return {
    products,
    categories,
    totalCount: options.totalCount ?? products.length,
    page: options.page ?? 1,
    pageSize: options.pageSize ?? 10,
  };
}

interface RenderProductListOptions {
  searchParams?: string;
  withHeader?: boolean;
}

function renderProductList({
  searchParams = '',
  withHeader = false,
}: RenderProductListOptions = {}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <NuqsTestingAdapter
        searchParams={searchParams}
        hasMemory
      >
        {withHeader && <HeaderNav />}
        <ProductListContent />
      </NuqsTestingAdapter>
    </QueryClientProvider>,
  );
}

describe('ProductListContent', () => {
  beforeEach(() => {
    useCartStore.setState({ items: new Map(), lastAddedId: null });
    useWishlistStore.setState({ ids: new Set() });
  });

  it('느린 응답 동안 로딩 안내를 보여주고 성공 후 상품과 전체 개수로 바꾼다', async () => {
    server.use(
      http.get('*/api/products', async () => {
        await delay(50);
        return HttpResponse.json(productListFixture);
      }),
    );

    renderProductList();

    expect(screen.getByRole('status')).toHaveTextContent(
      '상품을 불러오는 중입니다.',
    );
    expect(screen.queryByRole('combobox', { name: '카테고리' })).not.toBeInTheDocument();

    expect(
      await screen.findByRole('heading', { name: '테스트 상품' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByText('총 1개')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: '카테고리' })).toBeInTheDocument();
  });

  it('성공 응답에 상품이 없으면 전체 개수 0과 빈 결과 안내를 보여준다', async () => {
    server.use(
      http.get('*/api/products', () =>
        HttpResponse.json(makeResponse([], { totalCount: 0 })),
      ),
    );

    renderProductList();

    expect(await screen.findByText('상품이 없습니다.')).toBeInTheDocument();
    expect(screen.getByText('총 0개')).toBeInTheDocument();
  });

  it('첫 요청 실패 후 다시 시도하면 성공한 상품 목록으로 복구한다', async () => {
    let requestCount = 0;
    server.use(
      http.get('*/api/products', () => {
        requestCount += 1;
        if (requestCount === 1) {
          return HttpResponse.json({ message: '서버 오류' }, { status: 500 });
        }
        return HttpResponse.json(productListFixture);
      }),
    );
    const user = userEvent.setup();

    renderProductList();
    await user.click(
      await screen.findByRole('button', { name: '다시 시도' }),
    );

    expect(
      await screen.findByRole('heading', { name: '테스트 상품' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('상품을 불러오지 못했습니다.')).not.toBeInTheDocument();
    expect(requestCount).toBe(2);
  });

  it('기존 목록 갱신에 실패하면 목록을 유지하고 재시도로 새 목록을 보여준다', async () => {
    const initialProduct = makeProduct('initial', '기존 상품');
    const recoveredProduct = makeProduct('recovered', '복구된 패션 상품');
    let fashionRequestCount = 0;
    server.use(
      http.get('*/api/products', ({ request }) => {
        const category = new URL(request.url).searchParams.get('category');

        if (category !== 'fashion') {
          return HttpResponse.json(makeResponse([initialProduct]));
        }

        fashionRequestCount += 1;
        if (fashionRequestCount === 1) {
          return HttpResponse.json(
            { message: '서버 오류' },
            { status: 500 },
          );
        }

        return HttpResponse.json(makeResponse([recoveredProduct]));
      }),
    );
    const user = userEvent.setup();

    renderProductList();
    await screen.findByRole('heading', { name: '기존 상품' });

    await user.selectOptions(
      screen.getByRole('combobox', { name: '카테고리' }),
      'fashion',
    );

    expect(
      await screen.findByText('목록을 갱신하지 못했습니다.'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: '기존 상품' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '다시 시도' }));

    expect(
      await screen.findByRole('heading', { name: '복구된 패션 상품' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('목록을 갱신하지 못했습니다.'),
    ).not.toBeInTheDocument();
    expect(fashionRequestCount).toBe(2);
  });

  it('첫 요청이 실패하면 에러 안내를 보여주고 재시도도 실패하면 에러 화면을 유지한다', async () => {
    let requestCount = 0;
    server.use(
      http.get('*/api/products', () => {
        requestCount += 1;
        return HttpResponse.json({ message: '서버 오류' }, { status: 500 });
      }),
    );
    const user = userEvent.setup();

    renderProductList();
    const retryButton = await screen.findByRole('button', {
      name: '다시 시도',
    });
    expect(screen.getByText('상품을 불러오지 못했습니다.')).toBeInTheDocument();

    await user.click(retryButton);
    await waitFor(() => expect(requestCount).toBe(2));

    expect(screen.getByText('상품을 불러오지 못했습니다.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '다시 시도' })).toBeInTheDocument();
  });

  it('2페이지에서 카테고리를 바꾸면 1페이지 응답 상품을 보여준다', async () => {
    const initialProduct = makeProduct('initial', '기존 상품');
    const fashionProduct = makeProduct('fashion', '패션 상품');
    server.use(
      http.get('*/api/products', ({ request }) => {
        const url = new URL(request.url);
        const category = url.searchParams.get('category');
        const page = url.searchParams.get('page') ?? '1';

        if (category === 'fashion' && page === '1') {
          return HttpResponse.json(makeResponse([fashionProduct]));
        }
        return HttpResponse.json(
          makeResponse([initialProduct], { page: 2, pageSize: 10, totalCount: 20 }),
        );
      }),
    );
    const user = userEvent.setup();

    renderProductList({ searchParams: '?page=2' });
    await screen.findByRole('heading', { name: '기존 상품' });
    const categorySelect = screen.getByRole('combobox', {
      name: '카테고리',
    });
    await user.selectOptions(categorySelect, 'fashion');

    expect(
      await screen.findByRole('heading', { name: '패션 상품' }),
    ).toBeInTheDocument();
    expect(categorySelect).toHaveValue('fashion');
  });

  it('가격 낮은순을 선택하면 요청 결과 순서대로 모든 상품을 보여준다', async () => {
    const expensive = makeProduct('expensive', '고가 상품', 100000);
    const cheap = makeProduct('cheap', '저가 상품', 10000);
    const samePrice = makeProduct('same-price', '동일 가격 상품', 10000);
    server.use(
      http.get('*/api/products', ({ request }) => {
        const sort = new URL(request.url).searchParams.get('sort');
        const products =
          sort === 'price-asc'
            ? [cheap, samePrice, expensive]
            : [expensive, cheap, samePrice];
        return HttpResponse.json(makeResponse(products));
      }),
    );
    const user = userEvent.setup();

    renderProductList();
    await screen.findByRole('heading', { name: '고가 상품' });
    await user.selectOptions(
      screen.getByRole('combobox', { name: '정렬' }),
      'price-asc',
    );

    const productNames = (await screen.findAllByRole('heading', { level: 2 })).map(
      (heading) => heading.textContent,
    );
    expect(productNames).toEqual(['저가 상품', '동일 가격 상품', '고가 상품']);
  });

  it('다음 페이지로 이동하면 다른 상품을 보여주고 페이지 경계 버튼을 바꾼다', async () => {
    const firstProduct = makeProduct('page-1', '첫 페이지 상품');
    const secondProduct = makeProduct('page-2', '두 번째 페이지 상품');
    server.use(
      http.get('*/api/products', ({ request }) => {
        const page = Number(new URL(request.url).searchParams.get('page'));
        return HttpResponse.json(
          makeResponse(page === 2 ? [secondProduct] : [firstProduct], {
            page,
            pageSize: 1,
            totalCount: 2,
          }),
        );
      }),
    );
    const user = userEvent.setup();

    renderProductList();
    await screen.findByRole('heading', { name: '첫 페이지 상품' });
    expect(screen.getByRole('button', { name: '이전' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '다음' })).toBeEnabled();

    await user.click(screen.getByRole('button', { name: '다음' }));

    expect(
      await screen.findByRole('heading', { name: '두 번째 페이지 상품' }),
    ).toBeInTheDocument();
    expect(screen.getByText('2 / 2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '이전' })).toBeEnabled();
    expect(screen.getByRole('button', { name: '다음' })).toBeDisabled();
  });

  it('찜을 누르면 헤더 개수가 1이 되고 다시 누르면 0으로 돌아간다', async () => {
    const user = userEvent.setup();

    renderProductList({ withHeader: true });
    await screen.findByRole('heading', { name: '테스트 상품' });
    expect(screen.getByText('위시리스트 0')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '찜' }));
    expect(screen.getByText('위시리스트 1')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '찜 해제' }));
    expect(screen.getByText('위시리스트 0')).toBeInTheDocument();
  });
});
