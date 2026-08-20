import type { ProductListResponse } from '@/_pages/product-list/model/types';
import { makeProduct, testCategories } from '@/test/fixtures';
import { renderWithProviders } from '@/test/renderWithProviders';
import { server } from '@/test/server';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';

import { ProductListPage } from './ProductListPage';

/**
 * 검증 항목 4·5·6·7·8·9·10 (통합)
 *
 * 네트워크는 MSW 가 가로챈다. 기본 핸들러에는 성공 경로만 있고, 실패·빈 결과·순서는
 * 각 테스트 안에서 `server.use(...)` 로 덮는다.
 *
 * 첫 대기만 `findBy*` 로 하고 나머지는 동기로 확인한다. 모든 단언을 `waitFor` 로
 * 감싸면 "언제 참이 되었는가"를 잃어버려 늦게 반영되는 회귀를 못 잡는다.
 *
 * 항목 11(조작이 URL에 반영 · URL로 재진입)은 여기 없다. 테스트 어댑터가 URL 상태를
 * 누적하지 않아 단일 조작밖에 못 보므로 E2E 로 옮겼다 — 근거는 RFC 판단 1.
 */

/** 조건에 반응하는 목록 핸들러. 검색·카테고리·정렬·페이지를 실제로 처리한다. */
const listHandler = (all: ReturnType<typeof makeProduct>[]) =>
  http.get('/api/products', ({ request }) => {
    const params = new URL(request.url).searchParams;
    const category = params.get('category');
    const sort = params.get('sort');
    const page = Number(params.get('page') ?? '1');
    const pageSize = Number(params.get('pageSize') ?? '12');

    const filtered = all.filter((product) => category === null || category === 'all' || product.category === category);
    const sorted = [...filtered];
    if (sort === 'price-asc') sorted.sort((a, b) => a.price - b.price);
    if (sort === 'price-desc') sorted.sort((a, b) => b.price - a.price);

    const start = (page - 1) * pageSize;

    return HttpResponse.json<ProductListResponse>({
      products: sorted.slice(start, start + pageSize),
      categories: testCategories,
      totalCount: filtered.length,
      page,
      pageSize,
    });
  });

const productNames = () =>
  screen
    .getAllByRole('heading', { level: 3 })
    .map((heading) => heading.textContent)
    .filter((text): text is string => text !== null);

const results = () => screen.getByRole('region', { name: '상품 검색 결과' });

describe('상품 목록', () => {
  describe('항목 4 — 로딩에서 성공으로', () => {
    it('목록에 들어가면 로딩 안내가 사라지고 받은 상품 수만큼 카드를 본다', async () => {
      renderWithProviders(<ProductListPage />);

      expect(screen.getByRole('status')).toHaveTextContent('상품을 불러오는 중입니다');

      expect(await screen.findByText('총 3개')).toBeInTheDocument();
      expect(productNames()).toHaveLength(3);
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    // 경계 — 총 개수가 페이지 크기와 정확히 같으면 다음 페이지가 없어야 한다
    it('상품이 한 페이지에 딱 맞으면 다음 버튼을 누를 수 없다', async () => {
      const twelve = Array.from({ length: 12 }, (_, index) => makeProduct({ id: `p${index + 1}` }));
      server.use(listHandler(twelve));

      renderWithProviders(<ProductListPage />);

      expect(await screen.findByText('총 12개')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '다음' })).toBeDisabled();
    });
  });

  describe('항목 5 — 빈 결과', () => {
    it('조건 없이 들어왔는데 상품이 하나도 없으면 없다는 안내를 본다', async () => {
      server.use(listHandler([]));

      renderWithProviders(<ProductListPage />);

      expect(await screen.findByText('등록된 상품이 0개입니다.')).toBeInTheDocument();
      expect(screen.queryByRole('heading', { level: 3 })).not.toBeInTheDocument();
    });

    // 경계 — 조건이 있는 0건은 어떤 조건 때문인지 문장에 드러나야 한다
    it('검색 결과가 없으면 어떤 조건으로 찾았는지 문장으로 확인할 수 있다', async () => {
      server.use(listHandler([]));

      renderWithProviders(<ProductListPage />, { searchParams: '?q=없는상품&category=fashion' });

      const empty = await screen.findByText(/조건에 맞는 상품이 0개입니다/);
      expect(empty).toHaveTextContent('검색어 "없는상품"');
      expect(empty).toHaveTextContent('카테고리 "패션"');
    });
  });

  describe('항목 6 — 에러', () => {
    it('조건이 잘못돼 목록을 못 받으면 안내가 뜨되 조건을 고칠 필터 폼은 화면에 남는다', async () => {
      server.use(
        http.get('/api/products', () => HttpResponse.json({ message: '요청 조건을 확인해주세요.' }, { status: 400 })),
      );

      renderWithProviders(<ProductListPage />);

      expect(await screen.findByText('요청 조건을 확인해주세요.')).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: '검색' })).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: '카테고리' })).toBeInTheDocument();
    });

    // 경계 — 5xx 는 사용자가 손쓸 수 없으므로 경계로 올라가야 한다
    it('서버가 목록을 주지 못하면 목록 자리 전체가 다시 시도 안내로 바뀐다', async () => {
      server.use(http.get('/api/products', () => HttpResponse.json({ message: '서버 오류' }, { status: 500 })));

      renderWithProviders(<ProductListPage />);

      expect(await screen.findByText('상품 목록을 불러오지 못했습니다.')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  describe('항목 7 — 에러에서 재시도로 복구', () => {
    it('조건 문제로 실패한 뒤 다시 시도를 누르면 목록이 보인다', async () => {
      const user = userEvent.setup();
      let failed = false;
      server.use(
        http.get('/api/products', () => {
          if (failed)
            return HttpResponse.json<ProductListResponse>({
              products: [makeProduct({ id: 'p1', name: '복구된 상품' })],
              categories: testCategories,
              totalCount: 1,
              page: 1,
              pageSize: 12,
            });
          failed = true;
          return HttpResponse.json({ message: '요청 조건을 확인해주세요.' }, { status: 400 });
        }),
      );

      renderWithProviders(<ProductListPage />);

      await user.click(await screen.findByRole('button', { name: '다시 시도' }));

      expect(await screen.findByRole('heading', { name: '복구된 상품' })).toBeInTheDocument();
      expect(screen.queryByText('요청 조건을 확인해주세요.')).not.toBeInTheDocument();
    });

    it('서버 오류로 실패한 뒤 다시 시도를 누르면 목록이 보인다', async () => {
      const user = userEvent.setup();
      let failed = false;
      server.use(
        http.get('/api/products', () => {
          if (failed)
            return HttpResponse.json<ProductListResponse>({
              products: [makeProduct({ id: 'p1', name: '경계 복구' })],
              categories: testCategories,
              totalCount: 1,
              page: 1,
              pageSize: 12,
            });
          failed = true;
          return HttpResponse.json({ message: '서버 오류' }, { status: 500 });
        }),
      );

      renderWithProviders(<ProductListPage />);

      await user.click(await screen.findByRole('button', { name: '다시 시도' }));

      expect(await screen.findByRole('heading', { name: '경계 복구' })).toBeInTheDocument();
    });

    // 경계 — 재시도가 또 실패하면 에러 화면이 유지돼야 한다
    it('다시 시도했는데 또 실패하면 안내가 그대로 남고 목록은 비어 있다', async () => {
      const user = userEvent.setup();
      server.use(
        http.get('/api/products', () => HttpResponse.json({ message: '요청 조건을 확인해주세요.' }, { status: 400 })),
      );

      renderWithProviders(<ProductListPage />);

      await user.click(await screen.findByRole('button', { name: '다시 시도' }));

      await waitFor(() => expect(screen.getByText('요청 조건을 확인해주세요.')).toBeInTheDocument());
      expect(screen.queryByRole('heading', { level: 3 })).not.toBeInTheDocument();
    });
  });

  describe('항목 8 — 카테고리 변경', () => {
    const mixed = [
      makeProduct({ id: 'c1', name: '캐주얼 티', category: 'casual' }),
      makeProduct({ id: 'f1', name: '패션 코트', category: 'fashion' }),
    ];

    it('카테고리를 바꾸면 그 카테고리의 상품만 남는다', async () => {
      const user = userEvent.setup();
      server.use(listHandler(mixed));

      renderWithProviders(<ProductListPage />);

      expect(await screen.findByText('총 2개')).toBeInTheDocument();

      await user.selectOptions(screen.getByRole('combobox', { name: '카테고리' }), 'fashion');

      expect(await screen.findByText('총 1개')).toBeInTheDocument();
      expect(productNames()).toEqual(['패션 코트']);
    });

    // 경계 — 뒤쪽 페이지에서 조건을 바꾸면 1페이지로 돌아가야 한다
    it('3페이지에서 카테고리를 바꾸면 페이지가 1로 돌아간다', async () => {
      const user = userEvent.setup();
      server.use(listHandler(mixed));

      renderWithProviders(<ProductListPage />, { searchParams: '?page=3' });

      await screen.findByRole('combobox', { name: '카테고리' });
      await user.selectOptions(screen.getByRole('combobox', { name: '카테고리' }), 'fashion');

      expect(await within(results()).findByText('1 / 1')).toBeInTheDocument();
    });
  });

  describe('항목 9 — 정렬 변경', () => {
    const priced = [
      makeProduct({ id: 'a', name: '비싼 것', price: 90_000 }),
      makeProduct({ id: 'b', name: '싼 것', price: 1_000 }),
    ];

    it('낮은 가격순으로 바꾸면 카드 순서가 가격 오름차순이 된다', async () => {
      const user = userEvent.setup();
      server.use(listHandler(priced));

      renderWithProviders(<ProductListPage />);

      expect(await screen.findByText('총 2개')).toBeInTheDocument();

      await user.selectOptions(screen.getByRole('combobox', { name: '정렬' }), 'price-asc');

      await waitFor(() => expect(productNames()).toEqual(['싼 것', '비싼 것']));
    });

    // 경계 — 반대 방향으로 바꾸면 순서도 뒤집혀야 한다
    it('높은 가격순으로 바꾸면 카드 순서가 뒤집힌다', async () => {
      const user = userEvent.setup();
      server.use(listHandler(priced));

      renderWithProviders(<ProductListPage />, { searchParams: '?sort=price-asc' });

      await waitFor(() => expect(productNames()).toEqual(['싼 것', '비싼 것']));

      await user.selectOptions(screen.getByRole('combobox', { name: '정렬' }), 'price-desc');

      await waitFor(() => expect(productNames()).toEqual(['비싼 것', '싼 것']));
    });
  });

  describe('항목 10 — 페이지 이동', () => {
    const many = Array.from({ length: 15 }, (_, index) =>
      makeProduct({ id: `p${index + 1}`, name: `상품 ${index + 1}` }),
    );

    it('다음을 누르면 2페이지의 상품으로 목록이 바뀐다', async () => {
      const user = userEvent.setup();
      server.use(listHandler(many));

      renderWithProviders(<ProductListPage />);

      expect(await within(results()).findByText('1 / 2')).toBeInTheDocument();
      expect(productNames()).toHaveLength(12);

      await user.click(screen.getByRole('button', { name: '다음' }));

      expect(await within(results()).findByText('2 / 2')).toBeInTheDocument();
      await waitFor(() => expect(productNames()).toEqual(['상품 13', '상품 14', '상품 15']));
    });

    // 경계 — 첫 페이지와 마지막 페이지에서 이동 버튼이 막혀야 한다
    it('1페이지에서는 이전이, 마지막 페이지에서는 다음이 비활성화된다', async () => {
      const user = userEvent.setup();
      server.use(listHandler(many));

      renderWithProviders(<ProductListPage />);

      expect(await within(results()).findByText('1 / 2')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '이전' })).toBeDisabled();

      await user.click(screen.getByRole('button', { name: '다음' }));

      expect(await within(results()).findByText('2 / 2')).toBeInTheDocument();
      await waitFor(() => expect(screen.getByRole('button', { name: '다음' })).toBeDisabled());
      expect(screen.getByRole('button', { name: '이전' })).not.toBeDisabled();
    });
  });
});
