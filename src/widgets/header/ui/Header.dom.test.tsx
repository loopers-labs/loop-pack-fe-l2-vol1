import { ProductListPage } from '@/_pages/product-list/ui/ProductListPage';
import { useCartStore } from '@/entities/cart';
import { useWishlistStore } from '@/entities/wishlist';
import { renderWithProviders } from '@/test/renderWithProviders';
import { server } from '@/test/server';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';

import { Header } from './Header';

/**
 * 검증 항목 12 — 담기 → 헤더 개수 · 다시 누르면 빠짐 (통합)
 *
 * 목록의 버튼과 헤더는 서로를 모르고 store 로만 이어져 있다. 그 연결은 **두 컴포넌트를
 * 함께 렌더해야** 드러난다. 항목 1(단위)이 파생 규칙을 잡는다면 여기서는 배선을 잡는다 —
 * store 가 옳게 동작해도 헤더가 다른 selector 를 구독하면 숫자가 안 움직인다.
 */
const cardOf = async (productName: string) => {
  const heading = await screen.findByRole('heading', { name: productName });
  const card = heading.closest('article');

  if (card === null) throw new Error(`${productName} 카드를 찾지 못했습니다.`);

  return within(card);
};

const header = () => within(screen.getByRole('banner'));

const menu = () => within(screen.getByRole('navigation', { name: '주요 메뉴' }));

/** 나간 로그아웃 요청을 담아 돌려준다. 요청이 실제로 나갔다는 것을 여기서만 알 수 있다. */
const logoutSucceeds = () => {
  const requests: string[] = [];

  server.use(
    http.post('/api/auth/logout', ({ request }) => {
      requests.push(`${request.method} ${new URL(request.url).pathname}`);

      return new HttpResponse(null, { status: 204 });
    }),
  );

  return requests;
};

const renderListWithHeader = () =>
  renderWithProviders(
    <>
      <Header />
      <ProductListPage />
    </>,
  );

describe('헤더 개수와 목록 담기', () => {
  it('상품을 담으면 헤더 장바구니 개수가 1 늘고 버튼이 담김 상태가 된다', async () => {
    const user = userEvent.setup();
    renderListWithHeader();

    expect(header().getByText('장바구니 0')).toBeInTheDocument();

    const card = await cardOf('기본 티셔츠');
    await user.click(card.getByRole('button', { name: '기본 티셔츠 장바구니' }));

    expect(header().getByText('장바구니 1')).toBeInTheDocument();
    expect(card.getByRole('button', { name: '기본 티셔츠 장바구니' })).toHaveAttribute('aria-pressed', 'true');
    expect(card.getByRole('button', { name: '기본 티셔츠 장바구니' })).toHaveTextContent('담김');
  });

  it('담은 상품을 다시 누르면 헤더 개수가 0으로 돌아간다', async () => {
    const user = userEvent.setup();
    renderListWithHeader();

    const card = await cardOf('기본 티셔츠');
    const button = card.getByRole('button', { name: '기본 티셔츠 장바구니' });

    await user.click(button);
    expect(header().getByText('장바구니 1')).toBeInTheDocument();

    await user.click(button);

    expect(header().getByText('장바구니 0')).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-pressed', 'false');
  });

  // 경계 — 서로 다른 두 상품을 담으면 개수가 2가 되어야 한다
  it('서로 다른 두 상품을 담으면 헤더 개수가 2가 된다', async () => {
    const user = userEvent.setup();
    renderListWithHeader();

    const first = await cardOf('기본 티셔츠');
    const second = await cardOf('데일리 스니커즈');

    await user.click(first.getByRole('button', { name: '기본 티셔츠 장바구니' }));
    await user.click(second.getByRole('button', { name: '데일리 스니커즈 장바구니' }));

    expect(header().getByText('장바구니 2')).toBeInTheDocument();
  });

  // 경계 — 장바구니와 위시리스트는 별개 store 라 서로를 건드리면 안 된다
  it('위시리스트에 찜해도 장바구니 개수는 0으로 남는다', async () => {
    const user = userEvent.setup();
    renderListWithHeader();

    const card = await cardOf('기본 티셔츠');
    await user.click(card.getByRole('button', { name: '기본 티셔츠 위시리스트' }));

    expect(header().getByText('위시리스트 1')).toBeInTheDocument();
    expect(header().getByText('장바구니 0')).toBeInTheDocument();
  });
});

/**
 * 로그인 상태에 따른 메뉴 (통합)
 *
 * isLoggedIn 은 서버 레이아웃이 세션 쿠키를 읽어 내려주는 prop 이다. 여기서 보는 것은
 * **그 값이 화면으로 어떻게 드러나는가** 하나뿐이다.
 *
 * 로그인·로그아웃이 그 값을 실제로 바꾸는지는 여기서 알 수 없다. prop 이 바뀌려면
 * router.refresh() 로 서버가 트리를 다시 그려야 하는데 jsdom 에는 서버가 없다 —
 * 그 사슬은 4단계 E2E 가 지난다.
 */
describe('로그인 상태에 따른 메뉴', () => {
  it('로그인해 있으면 마이페이지와 로그아웃을 보고 로그인 링크는 사라진다', () => {
    renderWithProviders(<Header isLoggedIn />);

    expect(menu().getByRole('link', { name: '마이페이지' })).toBeInTheDocument();
    expect(menu().getByRole('button', { name: '로그아웃' })).toBeInTheDocument();
    expect(menu().queryByRole('link', { name: '로그인' })).not.toBeInTheDocument();
  });

  it('로그인하지 않았으면 로그인 링크만 보인다', () => {
    renderWithProviders(<Header />);

    expect(menu().getByRole('link', { name: '로그인' })).toBeInTheDocument();
    expect(menu().queryByRole('link', { name: '마이페이지' })).not.toBeInTheDocument();
    expect(menu().queryByRole('button', { name: '로그아웃' })).not.toBeInTheDocument();
  });

  // 로그아웃은 서버 세션만 끝낸다. 담아둔 것은 이 기기에 남는 값이라 건드리지 않기로 했다.
  // 헤더가 로그아웃 상태로 다시 그려지는 것은 서버 몫이라 여기서는 개수만 본다.
  it('로그아웃해도 담아둔 장바구니와 위시리스트 개수는 그대로다', async () => {
    useCartStore.setState({ cart: ['p1', 'p2'] });
    useWishlistStore.setState({ wishlist: ['p3'] });
    const requests = logoutSucceeds();

    renderWithProviders(<Header isLoggedIn />);
    await userEvent.setup().click(menu().getByRole('button', { name: '로그아웃' }));

    expect(requests).toEqual(['POST /api/auth/logout']);
    expect(header().getByText('장바구니 2')).toBeInTheDocument();
    expect(header().getByText('위시리스트 1')).toBeInTheDocument();
  });
});
