import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { renderWithProviders } from '@/test/render-with-providers';
import { ProductListPage } from './ProductListPage';
import type { ProductListResponse } from '@/entities/product/model';
import userEvent from '@testing-library/user-event';

// 이 파일(항목 4~10) 전체에서 재사용하는 fixture.
// 실제 commerce.ts 데이터와 독립적으로, 정렬/가격이 겹치지 않게 구성해
// assertion이 명확해지도록 함.
const fixtureProducts: ProductListResponse['products'] = [
  {
    id: 'fx-1',
    brand: 'Fixture Brand',
    name: '테스트 원목 스탠드 조명',
    category: 'home',
    price: 10000,
    originalPrice: null,
    image: '/images/fixtures/fx-1.jpg',
    freeShipping: false,
    sizes: [],
    rating: 4.1,
    reviewCount: 10,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'fx-2',
    brand: 'Fixture Brand',
    name: '테스트 미니멀 벽시계',
    category: 'home',
    price: 20000,
    originalPrice: null,
    image: '/images/fixtures/fx-2.jpg',
    freeShipping: true,
    sizes: [],
    rating: 4.5,
    reviewCount: 50,
    createdAt: '2026-02-01T00:00:00.000Z',
  },
];

const fixtureCategories: ProductListResponse['categories'] = [
  { id: 'home', name: '홈' },
];

function successResponse(
  overrides: Partial<ProductListResponse> = {},
): ProductListResponse {
  return {
    products: fixtureProducts,
    categories: fixtureCategories,
    totalCount: fixtureProducts.length,
    page: 1,
    pageSize: 12,
    ...overrides,
  };
}

describe('ProductListPage — 목록 로딩 → 성공 (항목 4)', () => {
  it('로딩 중에는 상품을 불러오는 중이라는 상태가 표시된다', () => {
    server.use(
      http.get('/api/products', () => HttpResponse.json(successResponse())),
    );

    renderWithProviders(<ProductListPage />);

    expect(screen.getByLabelText('상품을 불러오는 중')).toBeInTheDocument();
  });

  it('응답이 오면 로딩 상태가 사라지고 상품 목록이 표시된다', async () => {
    server.use(
      http.get('/api/products', () => HttpResponse.json(successResponse())),
    );

    renderWithProviders(<ProductListPage />);

    expect(
      await screen.findByText('테스트 원목 스탠드 조명'),
    ).toBeInTheDocument();
    expect(screen.getByText('테스트 미니멀 벽시계')).toBeInTheDocument();
    expect(
      screen.queryByLabelText('상품을 불러오는 중'),
    ).not.toBeInTheDocument();
  });

  it('응답의 totalCount가 화면에 표시된다', async () => {
    server.use(
      http.get('/api/products', () =>
        HttpResponse.json(successResponse({ totalCount: 2 })),
      ),
    );

    renderWithProviders(<ProductListPage />);

    expect(
      await screen.findByText(
        (_, element) => element?.textContent === '총 2개',
      ),
    ).toBeInTheDocument();
  });
});

describe('ProductListPage — 목록 빈 결과 (항목 5)', () => {
  it('상품이 없으면 상품이 없다는 안내 문구가 표시된다', async () => {
    server.use(
      http.get('/api/products', () =>
        HttpResponse.json(successResponse({ products: [], totalCount: 0 })),
      ),
    );

    renderWithProviders(<ProductListPage />);

    expect(await screen.findByText('상품이 없습니다.')).toBeInTheDocument();
  });

  it('빈 결과일 때는 상품 카드가 하나도 렌더되지 않는다', async () => {
    server.use(
      http.get('/api/products', () =>
        HttpResponse.json(successResponse({ products: [], totalCount: 0 })),
      ),
    );

    renderWithProviders(<ProductListPage />);

    await screen.findByText('상품이 없습니다.');
    expect(
      screen.queryByText('테스트 원목 스탠드 조명'),
    ).not.toBeInTheDocument();
  });
});

describe('ProductListPage — 목록 에러 (항목 6)', () => {
  it('서버 에러가 나면 오류 메시지가 표시된다', async () => {
    server.use(
      http.get('/api/products', () =>
        HttpResponse.json(
          { message: '상품 목록을 불러오지 못했습니다.' },
          { status: 500 },
        ),
      ),
    );

    renderWithProviders(<ProductListPage />);

    expect(await screen.findByText('오류가 발생했습니다.')).toBeInTheDocument();
  });

  it('에러 상태에서는 다시 시도 버튼이 함께 표시된다', async () => {
    server.use(
      http.get('/api/products', () =>
        HttpResponse.json(
          { message: '상품 목록을 불러오지 못했습니다.' },
          { status: 500 },
        ),
      ),
    );

    renderWithProviders(<ProductListPage />);

    await screen.findByText('오류가 발생했습니다.');
    expect(
      screen.getByRole('button', { name: '다시 시도' }),
    ).toBeInTheDocument();
  });
});

describe('ProductListPage — 에러에서 재시도로 복구 (항목 7)', () => {
  it('다시 시도 버튼을 누르면 이후 성공 응답으로 정상 목록이 표시된다', async () => {
    let requestCount = 0;
    server.use(
      http.get('/api/products', () => {
        requestCount += 1;
        if (requestCount === 1) {
          return HttpResponse.json(
            { message: '상품 목록을 불러오지 못했습니다.' },
            { status: 500 },
          );
        }
        return HttpResponse.json(successResponse());
      }),
    );

    renderWithProviders(<ProductListPage />);

    await screen.findByText('오류가 발생했습니다.');
    await userEvent.click(screen.getByRole('button', { name: '다시 시도' }));

    expect(
      await screen.findByText('테스트 원목 스탠드 조명'),
    ).toBeInTheDocument();
  });
});

describe('ProductListPage — 카테고리 변경 → 목록 변경 (항목 8)', () => {
  it('카테고리를 변경하면 해당 카테고리 요청 결과로 목록이 바뀐다', async () => {
    server.use(
      http.get('/api/products', ({ request }) => {
        const url = new URL(request.url);
        const category = url.searchParams.get('category');
        if (category === 'fashion') {
          return HttpResponse.json(
            successResponse({
              products: [
                {
                  ...fixtureProducts[0],
                  id: 'fx-fashion',
                  name: '패션 카테고리 상품',
                },
              ],
              totalCount: 1,
            }),
          );
        }
        return HttpResponse.json(successResponse());
      }),
    );

    renderWithProviders(<ProductListPage />);
    await screen.findByText('테스트 원목 스탠드 조명');

    const categorySelect = screen.getByLabelText(
      '카테고리',
    ) as HTMLSelectElement;
    await userEvent.selectOptions(categorySelect, '패션');
    await waitFor(() => expect(categorySelect.value).toBe('fashion'));

    expect(await screen.findByText('패션 카테고리 상품')).toBeInTheDocument();
    expect(
      screen.queryByText('테스트 원목 스탠드 조명'),
    ).not.toBeInTheDocument();
  });
});

describe('ProductListPage — 정렬 변경 → 순서 변경 (항목 9)', () => {
  it('정렬 옵션을 변경하면 해당 정렬 요청 결과로 목록 순서가 바뀐다', async () => {
    server.use(
      http.get('/api/products', ({ request }) => {
        const url = new URL(request.url);
        const sort = url.searchParams.get('sort');
        if (sort === 'price-desc') {
          return HttpResponse.json(
            successResponse({
              products: [fixtureProducts[1], fixtureProducts[0]],
            }),
          );
        }
        return HttpResponse.json(successResponse());
      }),
    );

    renderWithProviders(<ProductListPage />);
    await screen.findByText('테스트 원목 스탠드 조명');

    await userEvent.selectOptions(screen.getByLabelText('정렬'), '높은 가격순');

    const headings = await screen.findAllByRole('heading', { level: 3 });
    expect(headings[0]).toHaveTextContent('테스트 미니멀 벽시계');
    expect(headings[1]).toHaveTextContent('테스트 원목 스탠드 조명');
  });
});

describe('ProductListPage — 페이지 이동 → 목록 변경 (항목 10)', () => {
  it('다음 페이지 버튼을 누르면 다음 페이지 요청 결과로 목록이 바뀐다', async () => {
    server.use(
      http.get('/api/products', ({ request }) => {
        const url = new URL(request.url);
        const page = url.searchParams.get('page');
        if (page === '2') {
          return HttpResponse.json(
            successResponse({
              products: [
                { ...fixtureProducts[0], id: 'fx-page2', name: '2페이지 상품' },
              ],
              totalCount: 13,
              page: 2,
            }),
          );
        }
        return HttpResponse.json(successResponse({ totalCount: 13 }));
      }),
    );

    renderWithProviders(<ProductListPage />);
    await screen.findByText('테스트 원목 스탠드 조명');

    await userEvent.click(screen.getByRole('button', { name: '다음' }));

    expect(await screen.findByText('2페이지 상품')).toBeInTheDocument();
  });
});
