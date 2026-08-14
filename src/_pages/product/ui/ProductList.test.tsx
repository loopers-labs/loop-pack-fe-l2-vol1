// @vitest-environment jsdom
// [AI] ProductList 목록 상태 통합 테스트 (week-08 2단계, items 4-7).
// MSW로 목록 응답(성공/빈/에러/순차)을 제어하고, 상태 분기 렌더를 검증한다.
// 기본 핸들러는 성공 경로만 두고, 빈/에러/지연은 각 테스트에서 server.use()로 덮어쓴다.
// 에러 상태는 4xx로 만든다 — 5xx는 queryClient의 throwOnError가 error boundary로
// 던져버려 이 컴포넌트의 에러 분기에 도달하지 않는다.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse, delay } from 'msw';
import { server } from '@/test/mocks/server';
import { categories, sampleProducts } from '@/test/mocks/handlers';
import { PAGE_SIZE } from '@/features/product-filters/model/useProductListFilters';
import { useCartStore } from '@/features/add-to-cart/model/store';
import { useWishlistStore } from '@/features/toggle-wishlist/model/store';
import type { ProductListResponse } from '@/entities/product/model';
import { renderProductList } from '@/test/utils/renderProductList';

// [AI] 성공 응답 fixture. 기본 핸들러와 같은 데이터를 써서 테스트 간 기대치가 일치한다.
const successResponse = {
  products: sampleProducts,
  categories,
  totalCount: sampleProducts.length,
  page: 1,
  pageSize: 12,
} satisfies ProductListResponse;

const emptyResponse = {
  products: [],
  categories,
  totalCount: 0,
  page: 1,
  pageSize: 12,
} satisfies ProductListResponse;

// [AI] ProductList가 Header(장바구니/위시리스트 개수)를 포함하므로
// 전역 store와 localStorage를 매 테스트 전에 초기화해 오염을 막는다 (week-08.md:152).
beforeEach(() => {
  localStorage.clear();
  useCartStore.setState({ items: [], hasHydrated: false });
  useWishlistStore.setState({ items: [], hasHydrated: false });
});

afterEach(() => {
  cleanup();
});

describe('ProductList — 목록 상태 (items 4-7)', () => {
  it('item 4: 로딩 중엔 스켈레톤 PAGE_SIZE개를 보여주고, 응답 후 상품 카드로 전환된다', async () => {
    server.use(
      http.get('*/api/products', async () => {
        await delay(300);
        return HttpResponse.json(successResponse);
      })
    );
    const { container } = renderProductList();

    // [AI] 스켈레톤은 aria-hidden 장식 요소라 접근성 트리에 없다 —
    // 역할/이름 쿼리로는 원리상 못 찾으므로 장식용 속성으로 개수만 확인한다.
    // 스켈레톤 카드 1장에 .skeleton div가 6개씩 들어가므로 div가 아니라
    // article(aria-hidden="true" 카드) 자체를 센다.
    expect(container.querySelectorAll('article.product[aria-hidden="true"]')).toHaveLength(
      PAGE_SIZE
    );
    expect(screen.queryByRole('heading', { name: /테스트 상품/ })).not.toBeInTheDocument();

    await screen.findByRole('heading', { name: '테스트 상품 1' }); // 첫 대기(비동기 경계)

    expect(screen.getByRole('heading', { name: '테스트 상품 2' })).toBeInTheDocument();
    expect(container.querySelectorAll('article.product[aria-hidden="true"]')).toHaveLength(0);
    expect(screen.getByText('총 2개')).toBeInTheDocument();
  });

  it('item 5: 빈 결과(products=[])면 카드 없이 "검색 결과가 없습니다" 안내를 보여준다', async () => {
    server.use(http.get('*/api/products', () => HttpResponse.json(emptyResponse)));
    renderProductList();

    await screen.findByText(/검색 결과가 없습니다/); // 첫 대기(비동기 경계)

    expect(screen.queryByRole('heading', { name: /테스트 상품/ })).not.toBeInTheDocument();
    expect(screen.getByText('총 0개')).toBeInTheDocument();
  });

  it('item 6: 4xx 에러 응답이면 role=alert 안내와 "다시 시도" 버튼을 보여준다', async () => {
    server.use(
      http.get('*/api/products', () =>
        HttpResponse.json({ message: '일부러 실패한 응답' }, { status: 404 })
      )
    );
    renderProductList();

    // [AI] 서버가 내린 메시지가 그대로 보이는지로 ApiError 분기 선택을 검증한다
    // (UX 카피 문구 자체를 단언하는 게 아니다 — 메시지는 테스트 fixture가 만든 값).
    const alert = await screen.findByRole('alert'); // 첫 대기(비동기 경계)

    expect(alert).toHaveTextContent('일부러 실패한 응답');
    expect(screen.getByRole('button', { name: '다시 시도' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /테스트 상품/ })).not.toBeInTheDocument();
  });

  it('item 7: 실패 후 "다시 시도"를 누르면 성공 응답으로 복구된다 (MSW 순차 응답)', async () => {
    // [AI] 순차 응답: 첫 요청은 404, 이후 요청은 성공. 클로저 카운터로 제어한다.
    let failRemaining = 1;
    server.use(
      http.get('*/api/products', () => {
        if (failRemaining > 0) {
          failRemaining -= 1;
          return HttpResponse.json({ message: '일시적인 실패' }, { status: 404 });
        }
        return HttpResponse.json(successResponse);
      })
    );
    const user = userEvent.setup();
    renderProductList();

    await screen.findByRole('alert'); // 첫 번째 비동기 경계: 실패 → 에러 UI

    await user.click(screen.getByRole('button', { name: '다시 시도' }));

    await screen.findByRole('heading', { name: '테스트 상품 1' }); // 두 번째 비동기 경계: 재시도 결과

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByText('총 2개')).toBeInTheDocument();
  });
});
