// [AI] ProductList 필터·토글 통합 테스트 (week-08 2단계, 커밋 4, items 8-10, 12).
// 커밋 3(items 4-7)과 같은 render helper(renderProductList)를 쓰고,
// 사용자 조작(select 변경·버튼 클릭) 이후 목록/헤더가 어떻게 반응하는지를 검증한다.
// 기본 핸들러는 성공 경로만 두고, 카테고리/정렬/페이지별 응답은 각 테스트에서
// server.use()로 덮어쓴다 (week-08.md:149). 핵심은 "목록이 바뀌는가"이지
// "주소창이 바뀌는가"가 아니다(URL은 E2E item 11이 맡는다 — week08-test-plan.md 판단 1).
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import { categories } from '@/test/mocks/handlers';
import { PAGE_SIZE } from '@/features/product-filters/model/useProductListFilters';
import { useCartStore } from '@/features/add-to-cart/model/store';
import { useWishlistStore } from '@/features/toggle-wishlist/model/store';
import type { Product, ProductListResponse } from '@/entities/product/model';
import { renderProductList } from '@/test/utils/renderProductList';

// [AI] 필터 응답을 구분 가능하게 만드는 최소 fixture. handlers.ts의 sampleProducts와
// 달리 카테고리/가격/이름이 서로 달라야 "목록이 교체됐다"를 결정적으로 검증할 수 있다.
const makeProduct = (overrides: Pick<Product, 'id' | 'name'> & Partial<Product>): Product => ({
  brand: '테스트 브랜드',
  category: 'casual',
  price: 10_000,
  originalPrice: null,
  image: '/images/products/test-1.jpg',
  freeShipping: false,
  sizes: [],
  rating: 4.0,
  reviewCount: 10,
  createdAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

const listResponse = (
  products: Product[],
  totalCount = products.length,
  page = 1
): ProductListResponse => ({
  products,
  categories,
  totalCount,
  page,
  pageSize: PAGE_SIZE,
});

// [AI] ProductList가 Header(장바구니/위시리스트 개수)를 포함하므로
// 전역 store와 localStorage를 매 테스트 전에 초기화해 오염을 막는다 (week-08.md:152).
beforeEach(() => {
  localStorage.clear();
  useCartStore.setState({ items: [], hasHydrated: false });
  useWishlistStore.setState({ items: [], hasHydrated: false });
});

afterEach(() => {
  cleanup(); // 테스트가 종료될 때마다 DOM 초기화
});

describe('ProductList — 필터 변경 → 목록 변경 (items 8-10)', () => {
  it('item 8: 카테고리를 디지털로 바꾸면 목록이 해당 카테고리 상품으로 교체된다', async () => {
    const casualOnly = [makeProduct({ id: 'c1', name: '캐주얼 상품' })];
    const digitalOnly = [
      makeProduct({ id: 'd1', name: '디지털 상품 1', category: 'digital' }),
      makeProduct({ id: 'd2', name: '디지털 상품 2', category: 'digital' }),
    ];
    server.use(
      http.get('*/api/products', ({ request }) => {
        const category = new URL(request.url).searchParams.get('category');
        return HttpResponse.json(
          category === 'digital' ? listResponse(digitalOnly) : listResponse(casualOnly)
        );
      })
    );
    const user = userEvent.setup();
    renderProductList();

    await screen.findByRole('heading', { name: '캐주얼 상품' }); // 첫 대기(비동기 경계)

    await user.selectOptions(screen.getByLabelText('카테고리'), 'digital');

    await screen.findByRole('heading', { name: '디지털 상품 1' }); // 두 번째 경계: 새 응답 도착

    expect(screen.getByRole('heading', { name: '디지털 상품 2' })).toBeInTheDocument();
    // 경계: 이전 카테고리 상품이 잔존하지 않는다
    expect(screen.queryByRole('heading', { name: '캐주얼 상품' })).not.toBeInTheDocument();
  });

  it('item 9: 정렬을 가격 높은순으로 바꾸면 카드 순서가 가격 내림차순으로 바뀐다', async () => {
    const cheap = makeProduct({ id: 'cheap', name: '저가 상품', price: 10_000 });
    const middle = makeProduct({ id: 'middle', name: '중가 상품', price: 50_000 });
    const expensive = makeProduct({ id: 'expensive', name: '고가 상품', price: 100_000 });
    server.use(
      http.get('*/api/products', ({ request }) => {
        const sort = new URL(request.url).searchParams.get('sort');
        // [AI] price-desc 응답에만 expensive를 추가해 "새 응답 도착"을 결정적으로
        // 감지한다. 순서만 바꾸면 어느 쪽이든 이미 DOM에 있는 이름이라 전환을 못 잡는다.
        return HttpResponse.json(
          sort === 'price-desc'
            ? listResponse([expensive, middle, cheap])
            : listResponse([cheap, middle])
        );
      })
    );
    const user = userEvent.setup();
    renderProductList();

    await screen.findByRole('heading', { name: '저가 상품' });

    const initialOrder = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(initialOrder).toEqual(['저가 상품', '중가 상품']);

    await user.selectOptions(screen.getByLabelText('정렬'), 'price-desc');

    await screen.findByRole('heading', { name: '고가 상품' }); // 새 응답 도착 마커

    const sortedOrder = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(sortedOrder).toEqual(['고가 상품', '중가 상품', '저가 상품']);
  });

  it('item 10: 다음 페이지로 이동하면 2페이지 상품으로 교체되고, 마지막 페이지에선 다음 버튼이 비활성화된다', async () => {
    const page1 = [
      makeProduct({ id: 'pg1-a', name: '1페이지 상품 A' }),
      makeProduct({ id: 'pg1-b', name: '1페이지 상품 B' }),
    ];
    const page2 = [makeProduct({ id: 'pg2-a', name: '2페이지 상품 A' })];
    server.use(
      http.get('*/api/products', ({ request }) => {
        const page = new URL(request.url).searchParams.get('page') ?? '1';
        const isPage2 = page === '2';
        return HttpResponse.json(
          listResponse(isPage2 ? page2 : page1, PAGE_SIZE * 2, Number(page))
        );
      })
    );
    const user = userEvent.setup();
    renderProductList();

    await screen.findByRole('heading', { name: '1페이지 상품 A' });

    expect(screen.getByText('1 / 2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '다음' })).toBeEnabled();

    await user.click(screen.getByRole('button', { name: '다음' }));

    await screen.findByRole('heading', { name: '2페이지 상품 A' }); // 새 응답 도착 마커

    expect(screen.getByRole('heading', { name: '2페이지 상품 A' })).toBeInTheDocument();
    // 경계: 이전 페이지 상품이 잔존하지 않는다
    expect(screen.queryByRole('heading', { name: '1페이지 상품 A' })).not.toBeInTheDocument();
    expect(screen.getByText('2 / 2')).toBeInTheDocument();
    // 경계: 마지막 페이지에선 "다음"이 비활성화된다
    expect(screen.getByRole('button', { name: '다음' })).toBeDisabled();
  });
});

describe('ProductList — 담기 → 헤더 개수 (item 12)', () => {
  it('item 12: 상품을 담으면 헤더 장바구니 개수가 오르고, 다시 누르면 내려간다', async () => {
    const user = userEvent.setup();
    renderProductList();

    await screen.findByRole('heading', { name: '테스트 상품 1' }); // 첫 대기(비동기 경계)

    expect(screen.getByText('장바구니 0')).toBeInTheDocument();

    const cartButton = screen.getByRole('button', { name: '테스트 상품 1 장바구니' });
    await user.click(cartButton);

    expect(screen.getByText('장바구니 1')).toBeInTheDocument();
    expect(cartButton).toHaveTextContent('담기 해제');

    await user.click(cartButton);

    expect(screen.getByText('장바구니 0')).toBeInTheDocument();
    expect(cartButton).toHaveTextContent('담기');
  });

  it('item 12 경계: 서로 다른 상품을 독립적으로 담으면 2가 되고, 하나만 빼면 1이 된다', async () => {
    const user = userEvent.setup();
    renderProductList();

    // server.use()로 핸들러를 덮어쓰지 않았으므로 기본 핸들러(src/test/mocks/handlers.ts)가 응답한다.
    await screen.findByRole('heading', { name: '테스트 상품 1' });

    const first = screen.getByRole('button', { name: '테스트 상품 1 장바구니' });
    const second = screen.getByRole('button', { name: '테스트 상품 2 장바구니' });

    await user.click(first);
    await user.click(second);

    expect(screen.getByText('장바구니 2')).toBeInTheDocument();

    await user.click(first);

    expect(screen.getByText('장바구니 1')).toBeInTheDocument();
    // first만 빠지고 second는 담긴 채로 유지된다
    expect(second).toHaveTextContent('담기 해제');
  });
});
