import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import CommerceLayout from '@/app/(commerce)/layout';
import { createSessionToken } from '@/app/api/_data/auth';
import { SESSION_COOKIE } from '@/app/api/_data/auth-cookies';
import { useCartStore } from '@/entities/cart/model/cart-store';
import { orderQueries } from '@/entities/order';
import {
  CHECKOUT_STORAGE_KEY,
  useCheckoutStore,
} from '@/entities/order/model/checkout-store';
import { useWishlistStore } from '@/entities/wishlist/model/wishlist-store';
import { SESSION_USER } from '@tests/msw/fixtures';
import { server } from '@tests/msw/server';

const cookieStore = vi.hoisted(() => new Map<string, string>());

// 요청 스코프가 없는 jsdom에서는 cookies()가 던지므로 layout이 읽는 쿠키만 흉내 낸다.
vi.mock('next/headers', () => ({
  cookies: () =>
    Promise.resolve({
      get: (name: string) => {
        const value = cookieStore.get(name);

        return value === undefined ? undefined : { name, value };
      },
    }),
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
}));

/** 실제 서버 layout을 그대로 실행해 쿠키 → initialUser → 헤더까지 한 경로로 확인한다. */
async function buildCommerceLayout(queryClient = new QueryClient()) {
  return (
    <QueryClientProvider client={queryClient}>
      {await CommerceLayout({ children: <p>본문</p> })}
    </QueryClientProvider>
  );
}

/** layout의 서버 렌더 연결만 빠르게 확인한다. 실제 document 응답은 E2E에서 검증한다. */
async function serverRenderCommerceLayout() {
  document.body.innerHTML = renderToStaticMarkup(await buildCommerceLayout());
}

const renderCommerceLayout = async () => {
  const queryClient = new QueryClient();

  render(await buildCommerceLayout(queryClient));

  return { user: userEvent.setup(), queryClient };
};

const headerCountText = (label: string) =>
  screen.getByText(new RegExp(`^${label}`)).textContent;

beforeAll(async () => {
  await useCartStore.persist.rehydrate();
  await useWishlistStore.persist.rehydrate();
});

afterEach(() => {
  cookieStore.clear();
  // 정적 마크업은 RTL cleanup 대상이 아니라 직접 비운다.
  document.body.innerHTML = '';
});

describe('커머스 헤더 초기 HTML', () => {
  it('장바구니 카운트는 장바구니 화면으로 가는 링크다', async () => {
    await serverRenderCommerceLayout();

    expect(screen.getByRole('link', { name: /^장바구니/ })).toHaveAttribute(
      'href',
      '/cart',
    );
  });

  it('쿠키가 없으면 로그인 링크를 담는다', async () => {
    await serverRenderCommerceLayout();

    expect(screen.getByRole('link', { name: '로그인' })).toHaveAttribute(
      'href',
      '/login',
    );
  });

  it('유효한 세션 쿠키가 있으면 사용자 이름과 로그아웃을 담는다', async () => {
    cookieStore.set(SESSION_COOKIE, createSessionToken(SESSION_USER.id));

    await serverRenderCommerceLayout();

    expect(screen.getByText(SESSION_USER.name)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '로그아웃' }),
    ).toBeInTheDocument();
  });
});

describe('커머스 헤더 로그아웃', () => {
  it('로그아웃하면 계정 상태를 정리하고 장바구니·위시리스트는 유지한다', async () => {
    cookieStore.set(SESSION_COOKIE, createSessionToken(SESSION_USER.id));
    useCartStore.getState().actions.toggle('p1');
    useWishlistStore.getState().actions.toggle('p2');
    useCheckoutStore.setState({
      draftItems: [{ productId: 'p1', quantity: 1 }],
    });
    const userOrderQueryKey = [...orderQueries.all(), SESSION_USER.id];
    const { user, queryClient } = await renderCommerceLayout();

    queryClient.setQueryData(userOrderQueryKey, [{ id: 'previous-order' }]);

    expect(headerCountText('장바구니')).toBe('장바구니 1');
    expect(headerCountText('위시리스트')).toBe('위시리스트 1');

    await user.click(screen.getByRole('button', { name: '로그아웃' }));

    expect(
      await screen.findByRole('link', { name: '로그인' }),
    ).toBeInTheDocument();
    expect(headerCountText('장바구니')).toBe('장바구니 1');
    expect(headerCountText('위시리스트')).toBe('위시리스트 1');
    // 계정 범위 임시 draft만 비워지고 브라우저 원본은 남는다
    expect(useCheckoutStore.getState().draftItems).toEqual([]);
    expect(queryClient.getQueryData(userOrderQueryKey)).toBeUndefined();
  });

  it('로그아웃이 실패하면 세션·checkout draft·주문 캐시를 유지하고 오류를 알린다', async () => {
    cookieStore.set(SESSION_COOKIE, createSessionToken(SESSION_USER.id));
    useCheckoutStore
      .getState()
      .actions.createCheckoutDraft([{ productId: 'p1', quantity: 2 }]);
    const userOrderQueryKey = [...orderQueries.all(), SESSION_USER.id];
    server.use(
      http.post('*/api/auth/logout', () =>
        HttpResponse.json(
          { message: '로그아웃에 실패했습니다.' },
          { status: 500 },
        ),
      ),
    );
    const { user, queryClient } = await renderCommerceLayout();

    queryClient.setQueryData(userOrderQueryKey, [{ id: 'previous-order' }]);

    await user.click(screen.getByRole('button', { name: '로그아웃' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '로그아웃에 실패했습니다.',
    );
    expect(screen.getByText(SESSION_USER.name)).toBeInTheDocument();
    expect(useCheckoutStore.getState().draftItems).toEqual([
      { productId: 'p1', quantity: 2 },
    ]);
    // 새로고침 복원의 원천인 sessionStorage 사본도 함께 남아야 한다
    expect(
      JSON.parse(sessionStorage.getItem(CHECKOUT_STORAGE_KEY) ?? 'null'),
    ).toMatchObject({
      state: { draftItems: [{ productId: 'p1', quantity: 2 }] },
    });
    // 실패하면 쿠키가 살아 있으므로 주문 캐시도 그대로 둔다
    expect(queryClient.getQueryData(userOrderQueryKey)).toEqual([
      { id: 'previous-order' },
    ]);
  });
});
