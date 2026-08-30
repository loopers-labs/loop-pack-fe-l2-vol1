import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import CommerceLayout from '@/app/(commerce)/layout';
import { createSessionToken } from '@/app/api/_data/auth';
import { SESSION_COOKIE } from '@/app/api/_data/auth-cookies';
import { useCartStore } from '@/entities/cart/model/cart-store';
import { useWishlistStore } from '@/entities/wishlist/model/wishlist-store';
import { SESSION_USER } from '@tests/msw/fixtures';

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
async function buildCommerceLayout() {
  return (
    <QueryClientProvider client={new QueryClient()}>
      {await CommerceLayout({ children: <p>본문</p> })}
    </QueryClientProvider>
  );
}

/** layout의 서버 렌더 연결만 빠르게 확인한다. 실제 document 응답은 E2E에서 검증한다. */
async function serverRenderCommerceLayout() {
  document.body.innerHTML = renderToStaticMarkup(await buildCommerceLayout());
}

const renderCommerceLayout = async () => {
  render(await buildCommerceLayout());

  return { user: userEvent.setup() };
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
  it('로그인 링크로 바뀌고 장바구니·위시리스트 개수는 유지된다', async () => {
    cookieStore.set(SESSION_COOKIE, createSessionToken(SESSION_USER.id));
    useCartStore.getState().actions.toggle('p1');
    useWishlistStore.getState().actions.toggle('p2');
    const { user } = await renderCommerceLayout();

    expect(headerCountText('장바구니')).toBe('장바구니 1');
    expect(headerCountText('위시리스트')).toBe('위시리스트 1');

    await user.click(screen.getByRole('button', { name: '로그아웃' }));

    expect(
      await screen.findByRole('link', { name: '로그인' }),
    ).toBeInTheDocument();
    expect(headerCountText('장바구니')).toBe('장바구니 1');
    expect(headerCountText('위시리스트')).toBe('위시리스트 1');
  });
});
