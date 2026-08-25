import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NuqsTestingAdapter, type OnUrlUpdateFunction } from 'nuqs/adapters/testing';
import { http, HttpResponse, delay } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import ProductView from './ProductView';
import { categories, products } from '@/app/api/_data/commerce';
import type { Product, ProductListResponse } from '@/entities/product/model/product';
import { useCartStore } from '@/entities/cart/model/useCartStore';
import { useWishlistStore } from '@/entities/wishlist/model/useWishlistStore';
import { server } from '../../../../test/msw/server';

const CASUAL_FIRST = products.find((product) => product.id === 'p1') as Product;
const CASUAL_SECOND = products.find((product) => product.id === 'p2') as Product;
const FASHION_FIRST = products.find((product) => product.id === 'p6') as Product;
const DEFAULT_PAGE_SIZE = 12;
const UPDATE_DELAY_MS = 120;

function productListResponse(
  responseProducts: Product[],
  { page = 1, pageSize = DEFAULT_PAGE_SIZE, totalCount = responseProducts.length } = {},
): ProductListResponse {
  return { products: responseProducts, categories, page, pageSize, totalCount };
}

function renderProductView(searchParams = '', onUrlUpdate?: OnUrlUpdateFunction) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { gcTime: 0 } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <NuqsTestingAdapter searchParams={searchParams} hasMemory onUrlUpdate={onUrlUpdate}>
        <ProductView />
      </NuqsTestingAdapter>
    </QueryClientProvider>,
  );
}

describe('상품 목록 요청 상태', () => {
  beforeEach(() => {
    useWishlistStore.setState({ productIds: new Set() });
    useCartStore.setState({ productIds: new Set() });
  });

  // Week 08 Step 2 추가 — 목록 로딩 → 성공 경계: 기존 목록을 유지하는 갱신
  it('기존 목록을 갱신하는 동안 이전 상품을 유지하고 성공하면 새 상품으로 교체한다', async () => {
    const user = userEvent.setup();
    server.use(
      http.get('*/api/products', async ({ request }) => {
        const category = new URL(request.url).searchParams.get('category');
        if (category === 'fashion') {
          await delay(UPDATE_DELAY_MS);
          return HttpResponse.json(productListResponse([FASHION_FIRST]));
        }
        return HttpResponse.json(productListResponse([CASUAL_FIRST]));
      }),
    );
    renderProductView('?category=casual');
    expect(await screen.findByRole('heading', { name: CASUAL_FIRST.name })).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('카테고리'), 'fashion');
    await waitFor(() =>
      expect(screen.getByRole('region', { name: '상품 검색 결과' })).toHaveAttribute(
        'aria-busy',
        'true',
      ),
    );
    expect(screen.getByRole('heading', { name: CASUAL_FIRST.name })).toBeInTheDocument();

    expect(await screen.findByRole('heading', { name: FASHION_FIRST.name })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: CASUAL_FIRST.name })).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: '상품 검색 결과' })).toHaveAttribute(
      'aria-busy',
      'false',
    );
  });

  // Week 08 Step 2 추가 — 목록 빈 결과 정상: 기존 목록이 없는 최초 요청
  it('기존 목록이 없는 최초 요청이 빈 결과면 상품 카드 대신 빈 결과를 안내한다', async () => {
    server.use(http.get('*/api/products', () => HttpResponse.json(productListResponse([]))));
    renderProductView('?category=casual');

    expect(await screen.findByText('검색 결과가 없습니다.')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 3 })).not.toBeInTheDocument();
  });

  // Week 08 Step 2 추가 — 목록 빈 결과 경계: 기존 목록이 있는 갱신 요청
  it('기존 목록 갱신이 빈 결과로 성공하면 이전 상품을 제거하고 빈 결과를 안내한다', async () => {
    const user = userEvent.setup();
    server.use(
      http.get('*/api/products', ({ request }) => {
        const category = new URL(request.url).searchParams.get('category');
        return HttpResponse.json(
          category === 'fashion' ? productListResponse([]) : productListResponse([CASUAL_FIRST]),
        );
      }),
    );
    renderProductView('?category=casual');
    expect(await screen.findByRole('heading', { name: CASUAL_FIRST.name })).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('카테고리'), 'fashion');

    expect(await screen.findByText('검색 결과가 없습니다.')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: CASUAL_FIRST.name })).not.toBeInTheDocument();
  });

  // Week 08 Step 2 추가 — 목록 에러 정상: 기존 목록이 없는 서버 오류
  it('기존 목록이 없는 최초 요청이 서버 오류면 전체 오류와 재시도 수단을 표시한다', async () => {
    server.use(
      http.get('*/api/products', () =>
        HttpResponse.json({ message: '상품 목록을 불러오지 못했습니다.' }, { status: 500 }),
      ),
    );
    renderProductView('?category=casual');

    const alert = await screen.findByRole('alert', {}, { timeout: 3_000 });
    expect(alert).toHaveTextContent('상품 목록을 불러오지 못했습니다.');
    expect(screen.getByRole('button', { name: '다시 시도' })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: '상품 검색 결과' })).not.toBeInTheDocument();
  });

  // Week 08 Step 2 추가 — 목록 에러 경계: 기존 목록이 있는 네트워크 오류
  it('기존 목록 갱신이 네트워크 오류면 이전 상품과 인라인 오류 및 재시도 수단을 함께 표시한다', async () => {
    const user = userEvent.setup();
    server.use(
      http.get('*/api/products', ({ request }) => {
        const category = new URL(request.url).searchParams.get('category');
        return category === 'fashion'
          ? HttpResponse.error()
          : HttpResponse.json(productListResponse([CASUAL_FIRST]));
      }),
    );
    renderProductView('?category=casual');
    expect(await screen.findByRole('heading', { name: CASUAL_FIRST.name })).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('카테고리'), 'fashion');

    const alert = await screen.findByRole('alert', {}, { timeout: 3_000 });
    expect(alert).toHaveTextContent('목록을 갱신하지 못했습니다. 이전 목록을 표시하고 있어요.');
    expect(screen.getByRole('heading', { name: CASUAL_FIRST.name })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '다시 시도' })).toBeInTheDocument();
  });

  // Week 08 Step 2 추가 — 재시도 복구 정상: 최초 요청 실패 뒤 성공
  it('최초 요청 실패 뒤 재시도가 성공하면 전체 오류를 없애고 상품 목록으로 복구한다', async () => {
    const user = userEvent.setup();
    let shouldFail = true;
    server.use(
      http.get('*/api/products', () =>
        shouldFail
          ? HttpResponse.json({ message: '일시적인 서버 오류입니다.' }, { status: 500 })
          : HttpResponse.json(productListResponse([CASUAL_FIRST])),
      ),
    );
    renderProductView('?category=casual');
    expect(await screen.findByRole('alert', {}, { timeout: 3_000 })).toHaveTextContent(
      '일시적인 서버 오류입니다.',
    );

    shouldFail = false;
    await user.click(screen.getByRole('button', { name: '다시 시도' }));

    expect(await screen.findByRole('heading', { name: CASUAL_FIRST.name })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  // Week 08 Step 2 추가 — 재시도 복구 경계: 갱신 실패 뒤 성공
  it('갱신 실패 뒤 재시도가 성공하면 인라인 오류와 이전 상품을 새 상품으로 교체한다', async () => {
    const user = userEvent.setup();
    let fashionShouldFail = true;
    server.use(
      http.get('*/api/products', ({ request }) => {
        const category = new URL(request.url).searchParams.get('category');
        if (category !== 'fashion') {
          return HttpResponse.json(productListResponse([CASUAL_FIRST]));
        }
        return fashionShouldFail
          ? HttpResponse.json({ message: '갱신 실패' }, { status: 500 })
          : HttpResponse.json(productListResponse([FASHION_FIRST]));
      }),
    );
    renderProductView('?category=casual');
    expect(await screen.findByRole('heading', { name: CASUAL_FIRST.name })).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('카테고리'), 'fashion');
    expect(await screen.findByRole('alert', {}, { timeout: 3_000 })).toBeInTheDocument();

    fashionShouldFail = false;
    await user.click(screen.getByRole('button', { name: '다시 시도' }));

    expect(await screen.findByRole('heading', { name: FASHION_FIRST.name })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: CASUAL_FIRST.name })).not.toBeInTheDocument();
  });
});

describe('상품 목록 조건 변경', () => {
  beforeEach(() => {
    useWishlistStore.setState({ productIds: new Set() });
    useCartStore.setState({ productIds: new Set() });
  });

  // Week 08 Step 2 추가 — 카테고리 변경 정상/경계: 목록 교체와 페이지 초기화
  it('2페이지에서 카테고리를 변경하면 새 카테고리와 1페이지로 요청하고 해당 상품을 표시한다', async () => {
    const user = userEvent.setup();
    const requests: Array<{ category: string | null; page: string | null }> = [];
    server.use(
      http.get('*/api/products', ({ request }) => {
        const params = new URL(request.url).searchParams;
        const category = params.get('category');
        requests.push({ category, page: params.get('page') });
        return HttpResponse.json(
          category === 'fashion'
            ? productListResponse([FASHION_FIRST])
            : productListResponse([CASUAL_FIRST], { page: 2, totalCount: 24 }),
        );
      }),
    );
    renderProductView('?category=casual&page=2');
    expect(await screen.findByRole('heading', { name: CASUAL_FIRST.name })).toBeInTheDocument();
    expect(requests.at(-1)).toEqual({ category: 'casual', page: '2' });

    await user.selectOptions(screen.getByLabelText('카테고리'), 'fashion');

    expect(await screen.findByRole('heading', { name: FASHION_FIRST.name })).toBeInTheDocument();
    expect(requests.at(-1)).toEqual({ category: 'fashion', page: '1' });
    expect(screen.queryByRole('heading', { name: CASUAL_FIRST.name })).not.toBeInTheDocument();
  });

  // Week 08 Step 2 추가 — 정렬 변경 정상/경계: 응답 순서 반영과 페이지 초기화
  it('2페이지에서 정렬을 바꾸면 새 정렬과 1페이지로 요청하고 응답 순서대로 표시한다', async () => {
    const user = userEvent.setup();
    const requests: Array<{ sort: string | null; page: string | null }> = [];
    server.use(
      http.get('*/api/products', ({ request }) => {
        const params = new URL(request.url).searchParams;
        const sort = params.get('sort');
        requests.push({ sort, page: params.get('page') });
        const ordered =
          sort === 'price-asc' ? [CASUAL_SECOND, CASUAL_FIRST] : [CASUAL_FIRST, CASUAL_SECOND];
        return HttpResponse.json(
          productListResponse(ordered, { page: sort === 'price-asc' ? 1 : 2, totalCount: 24 }),
        );
      }),
    );
    renderProductView('?category=casual&sort=popular&page=2');
    expect(await screen.findByRole('heading', { name: CASUAL_FIRST.name })).toBeInTheDocument();
    expect(requests.at(-1)).toEqual({ sort: 'popular', page: '2' });

    await user.selectOptions(screen.getByLabelText('정렬'), 'price-asc');
    await screen.findByRole('heading', { name: CASUAL_SECOND.name });

    expect(requests.at(-1)).toEqual({ sort: 'price-asc', page: '1' });
    expect(
      screen.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent),
    ).toEqual([CASUAL_SECOND.name, CASUAL_FIRST.name]);
  });

  // Week 08 Step 2 추가 — 페이지 이동 정상/경계: 이전·다음 목록과 양 끝 비활성화
  it('다음과 이전으로 이동하면 요청한 페이지의 상품을 표시하고 양 끝 이동은 막는다', async () => {
    const user = userEvent.setup();
    const pageProducts = [CASUAL_FIRST, CASUAL_SECOND, FASHION_FIRST];
    const requestedPages: string[] = [];
    server.use(
      http.get('*/api/products', ({ request }) => {
        const page = new URL(request.url).searchParams.get('page') ?? '1';
        requestedPages.push(page);
        return HttpResponse.json(
          productListResponse([pageProducts[Number(page) - 1]], {
            page: Number(page),
            pageSize: 1,
            totalCount: pageProducts.length,
          }),
        );
      }),
    );
    renderProductView('?category=casual');
    expect(await screen.findByRole('heading', { name: CASUAL_FIRST.name })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '이전' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: '다음' }));
    expect(await screen.findByRole('heading', { name: CASUAL_SECOND.name })).toBeInTheDocument();
    expect(requestedPages.at(-1)).toBe('2');

    await user.click(screen.getByRole('button', { name: '이전' }));
    expect(await screen.findByRole('heading', { name: CASUAL_FIRST.name })).toBeInTheDocument();
    expect(screen.getByText('1 / 3')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '다음' }));
    await screen.findByRole('heading', { name: CASUAL_SECOND.name });
    await user.click(screen.getByRole('button', { name: '다음' }));
    expect(await screen.findByRole('heading', { name: FASHION_FIRST.name })).toBeInTheDocument();
    expect(requestedPages.at(-1)).toBe('3');
    expect(screen.getByRole('button', { name: '다음' })).toBeDisabled();
  });

  // Week 08 Step 2 추가 — 검색/필터 초기화 정상: 단일 조건과 URL 및 목록 초기화
  it('카테고리 조건을 초기화하면 필터와 URL을 기본값으로 되돌리고 기본 상품을 표시한다', async () => {
    const user = userEvent.setup();
    const updatedQueryStrings: string[] = [];
    const requests: Array<{ category: string | null; sort: string | null; page: string | null }> =
      [];
    server.use(
      http.get('*/api/products', ({ request }) => {
        const params = new URL(request.url).searchParams;
        const category = params.get('category');
        requests.push({ category, sort: params.get('sort'), page: params.get('page') });
        return HttpResponse.json(
          productListResponse(category === 'fashion' ? [FASHION_FIRST] : [CASUAL_FIRST]),
        );
      }),
    );
    renderProductView('?category=fashion', ({ queryString }) => {
      updatedQueryStrings.push(queryString);
    });
    expect(await screen.findByRole('heading', { name: FASHION_FIRST.name })).toBeInTheDocument();
    expect(screen.getByLabelText('카테고리')).toHaveValue('fashion');

    await user.click(screen.getByRole('button', { name: '초기화' }));

    expect(await screen.findByRole('heading', { name: CASUAL_FIRST.name })).toBeInTheDocument();
    expect(screen.getByLabelText('검색')).toHaveValue('');
    expect(screen.getByLabelText('카테고리')).toHaveValue('all');
    expect(screen.getByLabelText('정렬')).toHaveValue('latest');
    expect(updatedQueryStrings.at(-1)).toBe('');
    expect(requests.at(-1)).toEqual({ category: null, sort: 'latest', page: '1' });
  });

  // Week 08 Step 2 추가 — 검색/필터 초기화 경계: 여러 조건과 페이지를 한 번에 초기화
  it('검색/카테고리/정렬과 2페이지를 함께 초기화하면 모든 조건을 제거하고 1페이지 기본 목록을 표시한다', async () => {
    const user = userEvent.setup();
    const updatedQueryStrings: string[] = [];
    const requests: Array<{
      q: string | null;
      category: string | null;
      sort: string | null;
      page: string | null;
    }> = [];
    server.use(
      http.get('*/api/products', ({ request }) => {
        const params = new URL(request.url).searchParams;
        const query = {
          q: params.get('q'),
          category: params.get('category'),
          sort: params.get('sort'),
          page: params.get('page'),
        };
        requests.push(query);
        const hasAppliedConditions =
          query.q === '울' &&
          query.category === 'fashion' &&
          query.sort === 'price-desc' &&
          query.page === '2';
        const isSecondDefaultPage =
          query.q === null &&
          query.category === null &&
          query.sort === 'latest' &&
          query.page === '2';
        if (hasAppliedConditions) {
          return HttpResponse.json(
            productListResponse([FASHION_FIRST], { page: 2, pageSize: 1, totalCount: 2 }),
          );
        }
        if (isSecondDefaultPage) {
          return HttpResponse.json(
            productListResponse([CASUAL_SECOND], { page: 2, pageSize: 1, totalCount: 2 }),
          );
        }
        return HttpResponse.json(
          productListResponse([CASUAL_FIRST], { page: 1, pageSize: 1, totalCount: 2 }),
        );
      }),
    );
    renderProductView('?q=울&category=fashion&sort=price-desc&page=2', ({ queryString }) => {
      updatedQueryStrings.push(queryString);
    });
    expect(await screen.findByRole('heading', { name: FASHION_FIRST.name })).toBeInTheDocument();
    expect(screen.getByLabelText('검색')).toHaveValue('울');
    expect(screen.getByLabelText('카테고리')).toHaveValue('fashion');
    expect(screen.getByLabelText('정렬')).toHaveValue('price-desc');
    expect(screen.getByText('2 / 2')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '초기화' }));

    expect(await screen.findByRole('heading', { name: CASUAL_FIRST.name })).toBeInTheDocument();
    expect(screen.getByLabelText('검색')).toHaveValue('');
    expect(screen.getByLabelText('카테고리')).toHaveValue('all');
    expect(screen.getByLabelText('정렬')).toHaveValue('latest');
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
    expect(updatedQueryStrings.at(-1)).toBe('');
    expect(requests).toContainEqual({ q: null, category: null, sort: 'latest', page: '1' });
  });
});
