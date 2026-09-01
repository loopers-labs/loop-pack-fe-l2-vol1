// @vitest-environment jsdom

import '@/test/setupDom';
import '@/test/setupMsw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, delay, http } from 'msw';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HeaderNav } from '@/app/_components/HeaderNav';
import { CartStoreProvider } from '@/entities/cart/model/CartStoreProvider';
import type {
  Product,
  ProductListResponse,
} from '@/entities/product/model/types';
import { useWishlistStore } from '@/entities/wishlist/model/wishlistStore';
import { productListFixture } from '@/test/msw/fixtures';
import { server } from '@/test/msw/server';
import { ProductListContent } from './ProductListContent';

const router = vi.hoisted(() => ({
  replace: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => router,
}));

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
  options: Partial<
    Pick<ProductListResponse, 'page' | 'pageSize' | 'totalCount'>
  > = {},
): ProductListResponse {
  return {
    products,
    categories,
    totalCount: options.totalCount ?? products.length,
    page: options.page ?? 1,
    pageSize: options.pageSize ?? 10,
  };
}

function renderProductList({ withHeader = false } = {}) {
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
      <NuqsTestingAdapter hasMemory>
        <CartStoreProvider ownerKey="guest">
          {withHeader && <HeaderNav user={null} />}
          <ProductListContent />
        </CartStoreProvider>
      </NuqsTestingAdapter>
    </QueryClientProvider>,
  );
}

describe('ProductListContent', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('IntersectionObserver', undefined);
    useWishlistStore.setState({ ids: new Set(), isHydrated: true });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('느린 응답 동안 로딩 안내를 보여주고 성공 후 상품과 전체 개수로 바꾼다', async () => {
    server.use(
      http.get('*/api/products', async () => {
        await delay(50);
        return HttpResponse.json(productListFixture);
      }),
    );

    renderProductList();

    expect(screen.getByText('상품을 불러오는 중입니다.')).toBeInTheDocument();
    expect(
      screen.queryByRole('combobox', { name: '카테고리' }),
    ).not.toBeInTheDocument();

    expect(
      await screen.findByRole('heading', { name: '테스트 상품' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('상품을 불러오는 중입니다.'),
    ).not.toBeInTheDocument();
    expect(screen.getByText('총 1개')).toBeInTheDocument();
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
    expect(requestCount).toBe(2);
  });

  it('필터를 바꾸면 누적 상품을 지우고 새 조건의 1페이지부터 보여준다', async () => {
    const firstProduct = makeProduct('page-1', '첫 페이지 상품');
    const secondProduct = makeProduct('page-2', '두 번째 페이지 상품');
    const fashionProduct = makeProduct('fashion', '패션 상품');

    server.use(
      http.get('*/api/products', ({ request }) => {
        const url = new URL(request.url);
        const page = Number(url.searchParams.get('page'));
        const category = url.searchParams.get('category');

        if (category === 'fashion') {
          return HttpResponse.json(makeResponse([fashionProduct]));
        }

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
    await user.click(screen.getByRole('button', { name: '더 보기' }));
    await screen.findByRole('heading', { name: '두 번째 페이지 상품' });

    await user.selectOptions(
      screen.getByRole('combobox', { name: '카테고리' }),
      'fashion',
    );

    expect(
      await screen.findByRole('heading', { name: '패션 상품' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: '두 번째 페이지 상품' }),
    ).not.toBeInTheDocument();
  });

  it('가격 낮은순을 선택하면 정렬 조건의 1페이지 결과를 보여준다', async () => {
    const initialProduct = makeProduct('initial', '기존 상품');
    const expensive = makeProduct('expensive', '고가 상품', 100000);
    const cheap = makeProduct('cheap', '저가 상품', 10000);
    const samePrice = makeProduct('same-price', '동일 가격 상품', 10000);

    server.use(
      http.get('*/api/products', ({ request }) => {
        const sort = new URL(request.url).searchParams.get('sort');
        return HttpResponse.json(
          sort === 'price-asc'
            ? makeResponse([cheap, samePrice, expensive])
            : makeResponse([initialProduct]),
        );
      }),
    );
    const user = userEvent.setup();

    renderProductList();
    await screen.findByRole('heading', { name: '기존 상품' });
    await user.selectOptions(
      screen.getByRole('combobox', { name: '정렬' }),
      'price-asc',
    );

    const productNames = (
      await screen.findAllByRole('heading', { level: 2 })
    ).map((heading) => heading.textContent);
    expect(productNames).toEqual(['저가 상품', '동일 가격 상품', '고가 상품']);
  });

  it('필터 갱신이 실패하면 기존 목록을 유지하고 다시 시도해 새 목록으로 복구한다', async () => {
    const initialProduct = makeProduct('initial', '기존 상품');
    const recoveredProduct = makeProduct('fashion', '복구된 패션 상품');
    let fashionRequestCount = 0;

    server.use(
      http.get('*/api/products', ({ request }) => {
        const category = new URL(request.url).searchParams.get('category');

        if (category === 'fashion') {
          fashionRequestCount += 1;
          if (fashionRequestCount === 1) {
            return HttpResponse.json({ message: '서버 오류' }, { status: 500 });
          }
          return HttpResponse.json(makeResponse([recoveredProduct]));
        }

        return HttpResponse.json(makeResponse([initialProduct]));
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
      screen.queryByRole('heading', { name: '기존 상품' }),
    ).not.toBeInTheDocument();
    expect(fashionRequestCount).toBe(2);
  });

  it('검색하면 검색어와 1페이지를 요청하고 검색 결과만 보여준다', async () => {
    const initialProduct = makeProduct('initial', '기존 상품');
    const searchResult = makeProduct('search-result', '검색된 셔츠');

    server.use(
      http.get('*/api/products', ({ request }) => {
        const url = new URL(request.url);
        const query = url.searchParams.get('q');
        const page = url.searchParams.get('page');

        if (query === '셔츠' && page === '1') {
          return HttpResponse.json(makeResponse([searchResult]));
        }

        return HttpResponse.json(makeResponse([initialProduct]));
      }),
    );
    const user = userEvent.setup();

    renderProductList();
    await screen.findByRole('heading', { name: '기존 상품' });
    await user.type(screen.getByRole('textbox', { name: '상품 검색' }), '셔츠');

    expect(
      await screen.findByRole('heading', { name: '검색된 셔츠' }),
    ).toBeInTheDocument();
  });

  it('더 보기를 누르면 다음 상품을 기존 목록 아래에 추가하고 마지막에서 멈춘다', async () => {
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
    await user.click(screen.getByRole('button', { name: '더 보기' }));

    expect(
      await screen.findByRole('heading', { name: '두 번째 페이지 상품' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: '첫 페이지 상품' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '더 보기' })).not.toBeInTheDocument();
    expect(screen.getByText('모든 상품을 확인했습니다.')).toBeInTheDocument();
  });

  it('다음 페이지 실패 시 기존 상품을 유지하고 다시 시도해 이어서 표시한다', async () => {
    const firstProduct = makeProduct('page-1', '첫 페이지 상품');
    const secondProduct = makeProduct('page-2', '복구된 두 번째 상품');
    let secondPageRequestCount = 0;

    server.use(
      http.get('*/api/products', ({ request }) => {
        const page = Number(new URL(request.url).searchParams.get('page'));
        if (page === 2) {
          secondPageRequestCount += 1;
          if (secondPageRequestCount === 1) {
            return HttpResponse.json({ message: '서버 오류' }, { status: 500 });
          }
          return HttpResponse.json(
            makeResponse([secondProduct], { page: 2, pageSize: 1, totalCount: 2 }),
          );
        }

        return HttpResponse.json(
          makeResponse([firstProduct], { page: 1, pageSize: 1, totalCount: 2 }),
        );
      }),
    );
    const user = userEvent.setup();

    renderProductList();
    await screen.findByRole('heading', { name: '첫 페이지 상품' });
    await user.click(screen.getByRole('button', { name: '더 보기' }));

    expect(
      await screen.findByText('다음 상품을 불러오지 못했습니다.'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: '첫 페이지 상품' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(
      await screen.findByRole('heading', { name: '복구된 두 번째 상품' }),
    ).toBeInTheDocument();
    expect(secondPageRequestCount).toBe(2);
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

  it('다음 페이지 요청 중에는 같은 요청을 다시 시작하지 않는다', async () => {
    let secondPageRequestCount = 0;
    const firstProduct = makeProduct('page-1', '첫 페이지 상품');
    const secondProduct = makeProduct('page-2', '두 번째 페이지 상품');

    server.use(
      http.get('*/api/products', async ({ request }) => {
        const page = Number(new URL(request.url).searchParams.get('page'));
        if (page === 2) {
          secondPageRequestCount += 1;
          await delay(50);
        }
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
    const loadMore = screen.getByRole('button', { name: '더 보기' });
    await user.dblClick(loadMore);

    await waitFor(() => expect(secondPageRequestCount).toBe(1));
  });
});
