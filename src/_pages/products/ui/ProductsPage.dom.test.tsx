import { describe, expect, it } from 'vitest';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, delay, http } from 'msw';
import type { ProductListResponse } from '@/types/commerce';
import { makeProduct, makeProductList } from '@/shared/test/fixtures';
import { server } from '@/shared/test/msw/server';
import { renderWithProviders } from '@/shared/test/render';
import { ProductsPage } from './ProductsPage';

// 이 파일의 경계는 HTTP다. getProducts는 실제로 호출되고 실제로 fetch가 나가며,
// MSW가 그 요청을 가로챈다 — 응답 파싱과 에러 변환까지 전부 실제 코드를 지난다.
// 실패·지연·빈 결과는 기본 핸들러가 아니라 각 테스트가 여기서 덮는다.
function trackProducts(
  respond: (params: URLSearchParams) => ProductListResponse = () =>
    makeProductList(),
) {
  const requests: URLSearchParams[] = [];

  server.use(
    http.get('/api/products', ({ request }) => {
      const params = new URL(request.url).searchParams;
      requests.push(params);
      return HttpResponse.json(respond(params));
    }),
  );

  return requests;
}

const failProducts = () => {
  const requests: URLSearchParams[] = [];

  server.use(
    http.get('/api/products', ({ request }) => {
      requests.push(new URL(request.url).searchParams);
      return HttpResponse.json(
        { message: '상품 목록을 불러오지 못했습니다.' },
        { status: 500 },
      );
    }),
  );

  return requests;
};

const productNames = () =>
  screen
    .getAllByRole('heading', { level: 3 })
    .map((heading) => heading.textContent);

const result = () => screen.getByRole('region', { name: '상품 검색 결과' });
const pagination = () =>
  screen.getByRole('navigation', { name: '페이지 이동' });
const skeleton = () =>
  screen.queryByRole('status', { name: '상품 목록 불러오는 중' });

// 실패 경로는 재시도 1회(기본 지연 1초)를 실제로 태운다 — 화면과 같은 정책이라 대기가 필요하다.
const RETRY_TIMEOUT = 3_000;

describe('목록 로딩 → 성공 (1단계 4번)', () => {
  it('최초 진입에는 스켈레톤을 보여주고 응답이 오면 목록으로 바꾼다', async () => {
    trackProducts(() =>
      makeProductList({
        products: [
          makeProduct({ id: 'p1', name: '첫 상품' }),
          makeProduct({ id: 'p2', name: '둘째 상품' }),
        ],
      }),
    );

    renderWithProviders(<ProductsPage />);

    expect(skeleton()).toBeInTheDocument();

    expect(
      await screen.findByRole('heading', { name: '첫 상품', level: 3 }),
    ).toBeInTheDocument();
    expect(skeleton()).not.toBeInTheDocument();
    expect(result()).toHaveTextContent('총 2개');
    expect(productNames()).toEqual(['첫 상품', '둘째 상품']);
  });

  it('응답이 늦어도 빈 화면 대신 스켈레톤을 유지하다가 목록으로 바꾼다', async () => {
    server.use(
      http.get('/api/products', async () => {
        await delay(100);
        return HttpResponse.json(
          makeProductList({
            products: [makeProduct({ id: 'p1', name: '늦게 온 상품' })],
          }),
        );
      }),
    );

    renderWithProviders(<ProductsPage />);

    expect(skeleton()).toBeInTheDocument();

    expect(
      await screen.findByRole('heading', { name: '늦게 온 상품', level: 3 }),
    ).toBeInTheDocument();
    expect(skeleton()).not.toBeInTheDocument();
  });
});

describe('목록 빈 결과 (1단계 5번)', () => {
  it('검색 결과가 0건이면 어떤 조건 때문인지 문구로 알려준다', async () => {
    trackProducts(() => makeProductList({ products: [], totalCount: 0 }));

    renderWithProviders(<ProductsPage />, { searchParams: '?q=없는상품' });

    await waitFor(() => {
      expect(skeleton()).not.toBeInTheDocument();
    });
    expect(result()).toHaveTextContent(
      '검색 "없는상품" 조건에 맞는 상품이 없어요. (0개)',
    );
    expect(screen.queryAllByRole('heading', { level: 3 })).toHaveLength(0);
  });

  it('총 개수는 있는데 그 페이지가 비면 0건 문구를 보여주고 총 개수는 그대로 둔다', async () => {
    trackProducts((params) =>
      makeProductList({
        products: [],
        totalCount: 30,
        page: Number(params.get('page') ?? '1'),
      }),
    );

    renderWithProviders(<ProductsPage />, { searchParams: '?page=999' });

    await waitFor(() => {
      expect(skeleton()).not.toBeInTheDocument();
    });
    expect(result()).toHaveTextContent('총 30개');
    expect(result()).toHaveTextContent('전체 목록 조건에 맞는 상품이 없어요.');
  });
});

describe('목록 에러 (1단계 6번)', () => {
  it('보여줄 데이터 없이 실패하면 실패 이유와 다시 시도를 보여준다', async () => {
    failProducts();

    renderWithProviders(<ProductsPage />);

    const alert = await screen.findByRole(
      'alert',
      {},
      { timeout: RETRY_TIMEOUT },
    );
    expect(alert).toHaveTextContent('상품을 불러오지 못했어요.');
    expect(
      screen.getByRole('button', { name: '다시 시도' }),
    ).toBeInTheDocument();
    expect(skeleton()).not.toBeInTheDocument();
  });

  it('이미 목록이 있는 상태에서 갱신이 실패하면 목록을 지우지 않고 실패 배너만 올린다', async () => {
    trackProducts(() =>
      makeProductList({
        products: [makeProduct({ id: 'p1', name: '마지막으로 성공한 상품' })],
      }),
    );

    const { queryClient } = renderWithProviders(<ProductsPage />);
    await screen.findByRole('heading', {
      name: '마지막으로 성공한 상품',
      level: 3,
    });

    failProducts();
    await act(async () => {
      await queryClient.refetchQueries();
    });

    const alert = await screen.findByRole(
      'alert',
      {},
      { timeout: RETRY_TIMEOUT },
    );
    expect(alert).toHaveTextContent('갱신에 실패했어요.');
    expect(
      screen.getByRole('heading', { name: '마지막으로 성공한 상품', level: 3 }),
    ).toBeInTheDocument();
  });
});

describe('에러에서 재시도로 복구 (1단계 7번)', () => {
  it('다시 시도를 누르면 다시 요청해서 목록을 보여준다', async () => {
    const user = userEvent.setup();
    let attempts = 0;
    server.use(
      http.get('/api/products', () => {
        attempts += 1;
        // 첫 사용자 시도는 재시도 1회까지 포함해 2번 실패한다.
        if (attempts <= 2) {
          return HttpResponse.json(
            { message: '상품 목록을 불러오지 못했습니다.' },
            { status: 500 },
          );
        }
        return HttpResponse.json(
          makeProductList({
            products: [makeProduct({ id: 'p1', name: '복구된 상품' })],
          }),
        );
      }),
    );

    renderWithProviders(<ProductsPage />);
    await screen.findByRole('alert', {}, { timeout: RETRY_TIMEOUT });

    await user.click(screen.getByRole('button', { name: '다시 시도' }));

    expect(
      await screen.findByRole(
        'heading',
        { name: '복구된 상품', level: 3 },
        { timeout: RETRY_TIMEOUT },
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('재시도도 실패하면 실패 화면을 그대로 유지한다', async () => {
    const user = userEvent.setup();
    const requests = failProducts();

    renderWithProviders(<ProductsPage />);
    await screen.findByRole('alert', {}, { timeout: RETRY_TIMEOUT });
    const failedBefore = requests.length;

    await user.click(screen.getByRole('button', { name: '다시 시도' }));

    await waitFor(
      () => {
        expect(requests.length).toBeGreaterThan(failedBefore);
      },
      { timeout: RETRY_TIMEOUT },
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(
      '상품을 불러오지 못했어요.',
    );
  });
});

describe('카테고리 변경 → 목록 변경 (1단계 8번)', () => {
  it('카테고리를 바꾸면 그 카테고리로 다시 요청하고 목록이 바뀐다', async () => {
    const user = userEvent.setup();
    const requests = trackProducts((params) =>
      makeProductList({
        products: [
          makeProduct({
            id: 'p1',
            name:
              params.get('category') === 'fashion' ? '패션 상품' : '전체 상품',
          }),
        ],
      }),
    );

    renderWithProviders(<ProductsPage />);
    await screen.findByRole('heading', { name: '전체 상품', level: 3 });

    await user.selectOptions(screen.getByLabelText('카테고리'), 'fashion');

    expect(
      await screen.findByRole('heading', { name: '패션 상품', level: 3 }),
    ).toBeInTheDocument();
    expect(requests.at(-1)?.get('category')).toBe('fashion');
  });

  it('다른 페이지를 보던 중 카테고리를 바꾸면 1페이지부터 다시 본다', async () => {
    const user = userEvent.setup();
    const requests = trackProducts((params) =>
      makeProductList({
        products: [makeProduct({ id: 'p1' })],
        totalCount: 30,
        page: Number(params.get('page') ?? '1'),
      }),
    );

    renderWithProviders(<ProductsPage />, { searchParams: '?page=3' });
    await waitFor(() => {
      expect(requests.at(-1)?.get('page')).toBe('3');
    });

    await user.selectOptions(screen.getByLabelText('카테고리'), 'casual');

    await waitFor(() => {
      expect(requests.at(-1)?.get('category')).toBe('casual');
    });
    expect(requests.at(-1)?.get('page')).toBe('1');
  });
});

describe('정렬 변경 → 순서 변경 (1단계 9번)', () => {
  it('정렬을 바꾸면 그 정렬로 다시 요청하고 목록 순서가 바뀐다', async () => {
    const user = userEvent.setup();
    const requests = trackProducts((params) => {
      const names =
        params.get('sort') === 'price-desc'
          ? ['비싼 상품', '싼 상품']
          : ['싼 상품', '비싼 상품'];
      return makeProductList({
        products: names.map((name, index) =>
          makeProduct({ id: `p${index + 1}`, name }),
        ),
      });
    });

    renderWithProviders(<ProductsPage />);
    await screen.findByRole('heading', { name: '싼 상품', level: 3 });
    expect(productNames()).toEqual(['싼 상품', '비싼 상품']);

    await user.selectOptions(screen.getByLabelText('정렬'), 'price-desc');

    await waitFor(() => {
      expect(productNames()).toEqual(['비싼 상품', '싼 상품']);
    });
    expect(requests.at(-1)?.get('sort')).toBe('price-desc');
  });

  it('다른 페이지를 보던 중 정렬을 바꾸면 1페이지부터 다시 본다', async () => {
    const user = userEvent.setup();
    const requests = trackProducts((params) =>
      makeProductList({
        products: [makeProduct({ id: 'p1' })],
        totalCount: 30,
        page: Number(params.get('page') ?? '1'),
      }),
    );

    renderWithProviders(<ProductsPage />, { searchParams: '?page=2' });
    await waitFor(() => {
      expect(requests.at(-1)?.get('page')).toBe('2');
    });

    await user.selectOptions(screen.getByLabelText('정렬'), 'popular');

    await waitFor(() => {
      expect(requests.at(-1)?.get('sort')).toBe('popular');
    });
    expect(requests.at(-1)?.get('page')).toBe('1');
  });
});

describe('페이지 이동 → 목록 변경 (1단계 10번)', () => {
  const pagedProducts = () =>
    trackProducts((params) => {
      const page = Number(params.get('page') ?? '1');
      return makeProductList({
        products: [makeProduct({ id: `p${page}`, name: `${page}페이지 상품` })],
        totalCount: 30,
        page,
        pageSize: 12,
      });
    });

  it('다음을 누르면 다음 페이지를 요청하고 목록과 페이지 표시가 바뀐다', async () => {
    const user = userEvent.setup();
    const requests = pagedProducts();

    renderWithProviders(<ProductsPage />);
    await screen.findByRole('heading', { name: '1페이지 상품', level: 3 });
    expect(pagination()).toHaveTextContent('1 / 3');

    await user.click(screen.getByRole('button', { name: '다음' }));

    expect(
      await screen.findByRole('heading', { name: '2페이지 상품', level: 3 }),
    ).toBeInTheDocument();
    expect(pagination()).toHaveTextContent('2 / 3');
    expect(requests.at(-1)?.get('page')).toBe('2');
  });

  it('첫 페이지에서는 이전으로, 마지막 페이지에서는 다음으로 더 갈 수 없다', async () => {
    pagedProducts();

    const { unmount } = renderWithProviders(<ProductsPage />);
    await screen.findByRole('heading', { name: '1페이지 상품', level: 3 });
    expect(screen.getByRole('button', { name: '이전' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '다음' })).toBeEnabled();

    unmount();

    renderWithProviders(<ProductsPage />, { searchParams: '?page=3' });
    await screen.findByRole('heading', { name: '3페이지 상품', level: 3 });
    expect(screen.getByRole('button', { name: '다음' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '이전' })).toBeEnabled();
  });
});

describe('조작이 URL에 반영 · URL로 재진입 (1단계 11번)', () => {
  it('카테고리를 바꾸면 그 조건이 URL에 실린다', async () => {
    const user = userEvent.setup();
    const urls: string[] = [];
    trackProducts();

    renderWithProviders(<ProductsPage />, {
      onUrlUpdate: (event) => urls.push(event.queryString),
    });
    await screen.findAllByRole('heading', { level: 3 });

    await user.selectOptions(screen.getByLabelText('카테고리'), 'home');

    await waitFor(() => {
      expect(urls.at(-1)).toBe('?category=home');
    });
  });

  it('페이지를 넘기면 다른 조건은 유지한 채 page만 URL에 반영한다', async () => {
    const user = userEvent.setup();
    const urls: string[] = [];
    trackProducts((params) =>
      makeProductList({
        products: [makeProduct({ id: 'p1' })],
        totalCount: 30,
        page: Number(params.get('page') ?? '1'),
      }),
    );

    renderWithProviders(<ProductsPage />, {
      searchParams: '?category=home',
      onUrlUpdate: (event) => urls.push(event.queryString),
    });
    await screen.findAllByRole('heading', { level: 3 });

    await user.click(screen.getByRole('button', { name: '다음' }));

    await waitFor(() => {
      expect(urls.at(-1)).toBe('?category=home&page=2');
    });
  });

  it('조건이 담긴 URL로 들어오면 그 조건으로 화면과 요청을 세운다', async () => {
    const requests = trackProducts();

    renderWithProviders(<ProductsPage />, {
      searchParams: '?q=셔츠&category=fashion&sort=price-desc&page=2',
    });

    await waitFor(() => {
      expect(requests).toHaveLength(1);
    });
    expect(requests[0].get('q')).toBe('셔츠');
    expect(requests[0].get('category')).toBe('fashion');
    expect(requests[0].get('sort')).toBe('price-desc');
    expect(requests[0].get('page')).toBe('2');

    expect(screen.getByLabelText('카테고리')).toHaveValue('fashion');
    expect(screen.getByLabelText('정렬')).toHaveValue('price-desc');
    expect(screen.getByLabelText('검색')).toHaveValue('셔츠');
  });

  it('URL에 없는 조건 값이 들어오면 기본값으로 정규화해서 요청한다', async () => {
    const requests = trackProducts();

    renderWithProviders(<ProductsPage />, {
      searchParams: '?category=없는카테고리&sort=newest&page=abc',
    });

    await waitFor(() => {
      expect(requests).toHaveLength(1);
    });
    expect(requests[0].get('category')).toBe('all');
    expect(requests[0].get('sort')).toBe('latest');
    expect(requests[0].get('page')).toBe('1');

    expect(screen.getByLabelText('카테고리')).toHaveValue('all');
    expect(screen.getByLabelText('정렬')).toHaveValue('latest');
  });
});
