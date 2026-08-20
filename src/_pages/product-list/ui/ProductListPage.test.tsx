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
  // 정상: 1) 로딩 중 "상품을 불러오는 중" 상태 표시
  //       2) 응답 성공 시 로딩 사라지고 상품 목록 표시
  //       3) totalCount가 화면에 표시됨
  // 경계: 4) 상품이 단 1개뿐이어도 정상적으로 로딩→표시됨
  //       5) 재요청(isFetching) 중에도 기존 목록이 화면에서 사라지지 않고 유지됨
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

  it('상품이 단 1개뿐이어도 정상적으로 로딩 후 표시된다', async () => {
    server.use(
      http.get('/api/products', () =>
        HttpResponse.json(
          successResponse({
            products: [fixtureProducts[0]],
            totalCount: 1,
          }),
        ),
      ),
    );

    renderWithProviders(<ProductListPage />);

    expect(
      await screen.findByText('테스트 원목 스탠드 조명'),
    ).toBeInTheDocument();
    expect(screen.queryByText('테스트 미니멀 벽시계')).not.toBeInTheDocument();
  });

  it('재요청 중에도 기존 목록이 화면에서 사라지지 않고 유지된다', async () => {
    let requestCount = 0;
    server.use(
      http.get('/api/products', () => {
        requestCount += 1;
        // 두 번째 요청(카테고리 변경 등으로 인한 재요청)에도 응답 전까지
        // isFetching 상태가 되며, 이때 기존 목록이 사라지면 안 됨
        return HttpResponse.json(
          successResponse({
            totalCount: requestCount,
          }),
        );
      }),
    );

    renderWithProviders(<ProductListPage />);
    await screen.findByText('테스트 원목 스탠드 조명');

    // 카테고리 변경으로 재요청을 트리거
    await userEvent.selectOptions(screen.getByLabelText('카테고리'), '캐주얼');

    // 재요청 중(isFetching)에도 기존 상품명이 화면에서 사라지지 않아야 함
    expect(screen.getByText('테스트 원목 스탠드 조명')).toBeInTheDocument();
  });
});

describe('ProductListPage — 목록 빈 결과 (항목 5)', () => {
  // 정상: 1) 상품이 없으면 안내 문구 표시
  //       2) 빈 결과일 때 상품 카드가 하나도 렌더되지 않음
  // 경계: 3) 빈 결과일 때 페이지네이션이 비정상 값(예: 1/0)으로 표시되지 않음
  //       4) 검색어가 있는 상태에서 빈 결과가 나와도 동일하게 안내 문구가 표시됨
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

  it('빈 결과일 때 페이지네이션이 비정상 값으로 표시되지 않는다', async () => {
    server.use(
      http.get('/api/products', () =>
        HttpResponse.json(successResponse({ products: [], totalCount: 0 })),
      ),
    );

    renderWithProviders(<ProductListPage />);

    await screen.findByText('상품이 없습니다.');
    // totalPages = Math.ceil(0 / pageSize) = 0 이 아니라 최소 1로 처리되어야 함
    expect(
      screen.getByText((_, element) => element?.textContent === '1 / 1'),
    ).toBeInTheDocument();
  });

  it('검색어가 있는 상태에서 빈 결과가 나와도 동일하게 안내 문구가 표시된다', async () => {
    server.use(
      http.get('/api/products', ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get('q') === '존재하지않는상품') {
          return HttpResponse.json(
            successResponse({ products: [], totalCount: 0 }),
          );
        }
        return HttpResponse.json(successResponse());
      }),
    );

    renderWithProviders(<ProductListPage />, {
      searchParams: '?q=존재하지않는상품',
    });

    expect(await screen.findByText('상품이 없습니다.')).toBeInTheDocument();
  });
});

describe('ProductListPage — 목록 에러 (항목 6)', () => {
  // 정상: 1) 서버 500 에러 시 오류 메시지 표시
  //       2) 에러 상태에서 다시 시도 버튼 함께 표시
  // 경계: 3) 네트워크 자체가 실패(응답 없음)해도 동일하게 에러 UI가 표시됨
  //       4) 400대 에러(잘못된 요청)와 500대 서버 에러 모두 같은 에러 UI로 처리됨
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

  it('네트워크 자체가 실패해도 동일한 에러 UI가 표시된다', async () => {
    server.use(http.get('/api/products', () => HttpResponse.error()));

    renderWithProviders(<ProductListPage />);

    expect(await screen.findByText('오류가 발생했습니다.')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '다시 시도' }),
    ).toBeInTheDocument();
  });

  it('400대 요청 오류도 500대 서버 오류와 동일한 에러 UI로 처리된다', async () => {
    server.use(
      http.get('/api/products', () =>
        HttpResponse.json(
          { message: '요청 조건을 확인해주세요.' },
          { status: 400 },
        ),
      ),
    );

    renderWithProviders(<ProductListPage />);

    expect(await screen.findByText('오류가 발생했습니다.')).toBeInTheDocument();
  });
});

describe('ProductListPage — 에러에서 재시도로 복구 (항목 7)', () => {
  // 정상: 1) 다시 시도 버튼을 누르면 이후 성공 응답으로 정상 목록이 표시됨
  // 경계: 2) 재시도해도 또 실패하면 에러 UI가 계속 유지되고, 다시 시도 버튼도 계속 남아있음
  //       3) 여러 번 실패 후 N번째 재시도에 성공해도 정상적으로 복구됨
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

  it('재시도해도 또 실패하면 에러 UI와 다시 시도 버튼이 계속 유지된다', async () => {
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
    await userEvent.click(screen.getByRole('button', { name: '다시 시도' }));

    // 재시도해도 계속 500이므로 에러 UI가 그대로 유지되어야 함
    expect(await screen.findByText('오류가 발생했습니다.')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '다시 시도' }),
    ).toBeInTheDocument();
  });

  it('여러 번 실패한 뒤 재시도에 성공하면 정상적으로 복구된다', async () => {
    let requestCount = 0;
    server.use(
      http.get('/api/products', () => {
        requestCount += 1;
        // 처음 두 번은 실패, 세 번째부터 성공
        if (requestCount <= 2) {
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

    await screen.findByText('오류가 발생했습니다.');
    await userEvent.click(screen.getByRole('button', { name: '다시 시도' }));

    expect(
      await screen.findByText('테스트 원목 스탠드 조명'),
    ).toBeInTheDocument();
  });
});

describe('ProductListPage — 카테고리 변경 → 목록 변경 (항목 8)', () => {
  // 정상: 1) 카테고리를 변경하면 해당 카테고리 요청 결과로 목록이 바뀜
  // 경계: 2) 카테고리를 다시 "전체"로 되돌리면 원래 전체 목록으로 돌아옴
  //       3) 2페이지 상태에서 카테고리를 바꾸면 page가 1로 리셋되어 요청됨
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

  it('카테고리를 다시 전체로 되돌리면 원래 전체 목록으로 돌아온다', async () => {
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
    await screen.findByText('패션 카테고리 상품');

    await userEvent.selectOptions(categorySelect, '전체');
    await waitFor(() => expect(categorySelect.value).toBe('all'));

    expect(
      await screen.findByText('테스트 원목 스탠드 조명'),
    ).toBeInTheDocument();
    expect(screen.queryByText('패션 카테고리 상품')).not.toBeInTheDocument();
  });

  it('2페이지 상태에서 카테고리를 바꾸면 page가 1로 리셋되어 요청된다', async () => {
    const requestedPages: string[] = [];
    server.use(
      http.get('/api/products', ({ request }) => {
        const url = new URL(request.url);
        requestedPages.push(url.searchParams.get('page') ?? '1');
        return HttpResponse.json(successResponse({ totalCount: 13 }));
      }),
    );

    renderWithProviders(<ProductListPage />);
    await screen.findByText('테스트 원목 스탠드 조명');

    await userEvent.click(screen.getByRole('button', { name: '다음' }));
    await waitFor(() => expect(requestedPages).toContain('2'));

    await userEvent.selectOptions(screen.getByLabelText('카테고리'), '홈');

    await waitFor(() => expect(requestedPages.at(-1)).toBe('1'));
  });
});

describe('ProductListPage — 정렬 변경 → 순서 변경 (항목 9)', () => {
  // 정상: 1) 정렬 옵션을 변경하면 해당 정렬 요청 결과로 목록 순서가 바뀜
  // 경계: 2) 정렬을 연속으로 여러 번 바꿔도 매번 올바른 순서로 갱신됨
  //       3) 2페이지 상태에서 정렬을 바꾸면 page가 1로 리셋되어 요청됨
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

  it('정렬을 연속으로 여러 번 바꿔도 매번 올바른 순서로 갱신된다', async () => {
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
        if (sort === 'price-asc') {
          return HttpResponse.json(
            successResponse({
              products: [fixtureProducts[0], fixtureProducts[1]],
            }),
          );
        }
        return HttpResponse.json(successResponse());
      }),
    );

    renderWithProviders(<ProductListPage />);
    await screen.findByText('테스트 원목 스탠드 조명');

    const sortSelect = screen.getByLabelText('정렬');

    await userEvent.selectOptions(sortSelect, '높은 가격순');
    let headings = await screen.findAllByRole('heading', { level: 3 });
    expect(headings[0]).toHaveTextContent('테스트 미니멀 벽시계');

    await userEvent.selectOptions(sortSelect, '낮은 가격순');
    headings = await screen.findAllByRole('heading', { level: 3 });
    expect(headings[0]).toHaveTextContent('테스트 원목 스탠드 조명');
  });

  it('2페이지 상태에서 정렬을 바꾸면 page가 1로 리셋되어 요청된다', async () => {
    const requestedPages: string[] = [];
    server.use(
      http.get('/api/products', ({ request }) => {
        const url = new URL(request.url);
        requestedPages.push(url.searchParams.get('page') ?? '1');
        return HttpResponse.json(successResponse({ totalCount: 13 }));
      }),
    );

    renderWithProviders(<ProductListPage />);
    await screen.findByText('테스트 원목 스탠드 조명');

    await userEvent.click(screen.getByRole('button', { name: '다음' }));
    await waitFor(() => expect(requestedPages).toContain('2'));

    await userEvent.selectOptions(screen.getByLabelText('정렬'), '낮은 가격순');

    await waitFor(() => expect(requestedPages.at(-1)).toBe('1'));
  });
});

describe('ProductListPage — 페이지 이동 → 목록 변경 (항목 10)', () => {
  // 정상: 1) 다음 페이지 버튼을 누르면 다음 페이지 요청 결과로 목록이 바뀜
  // 경계: 2) 1페이지(첫 페이지)에서는 "이전" 버튼이 비활성화됨
  //       3) 마지막 페이지에서는 "다음" 버튼이 비활성화됨
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

  it('1페이지에서는 이전 버튼이 비활성화된다', async () => {
    server.use(
      http.get('/api/products', () =>
        HttpResponse.json(successResponse({ totalCount: 13 })),
      ),
    );

    renderWithProviders(<ProductListPage />);
    await screen.findByText('테스트 원목 스탠드 조명');

    expect(screen.getByRole('button', { name: '이전' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '다음' })).toBeEnabled();
  });

  it('마지막 페이지에서는 다음 버튼이 비활성화된다', async () => {
    server.use(
      http.get('/api/products', ({ request }) => {
        const url = new URL(request.url);
        const page = url.searchParams.get('page') ?? '1';
        return HttpResponse.json(
          successResponse({ totalCount: 13, page: Number(page) }),
        );
      }),
    );

    renderWithProviders(<ProductListPage />);
    await screen.findByText('테스트 원목 스탠드 조명');

    // totalCount 13, pageSize 12 → totalPages 2. 2페이지로 이동하면 마지막 페이지.
    await userEvent.click(screen.getByRole('button', { name: '다음' }));
    await screen.findByText((_, element) => element?.textContent === '2 / 2');

    expect(screen.getByRole('button', { name: '다음' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '이전' })).toBeEnabled();
  });
});
