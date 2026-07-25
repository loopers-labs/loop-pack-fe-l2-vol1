import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Profiler } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { CartCount } from '@/features/cart/CartCount';
import { ProductCard } from '@/features/products/ProductCard';
import { WishlistCount } from '@/features/wishlist/WishlistCount';
import type { Product } from '@/types/commerce';

const PRODUCT: Product = {
  id: 'p9',
  brand: 'Loopers Select',
  name: '오크 원형 사이드 테이블',
  category: 'home',
  price: 89000,
  originalPrice: null,
  image: '/images/products/p9.jpg',
  freeShipping: true,
  sizes: [],
  rating: 4.7,
  reviewCount: 128,
  createdAt: '2026-01-01T00:00:00.000Z',
};

/**
 * 홈과 목록은 같은 ProductCard를 쓰므로 카드를 두 번 렌더한 것이 곧 두 화면이다.
 * 조회·URL 상태를 걷어내고 store 공유만 남긴다.
 */
function renderBothScreens(onCartCountRender = vi.fn()) {
  render(
    <>
      <Profiler id="cart-count" onRender={onCartCountRender}>
        <CartCount />
      </Profiler>
      <WishlistCount />
      <section aria-label="홈">
        <ProductCard product={PRODUCT} headingLevel="h2" />
      </section>
      <section aria-label="목록">
        <ProductCard product={PRODUCT} headingLevel="h3" />
      </section>
    </>,
  );

  return { user: userEvent.setup(), onCartCountRender };
}

const cartButtonIn = (screenName: string) =>
  within(screen.getByRole('region', { name: screenName })).getByRole('button', {
    name: `${PRODUCT.name} 담기`,
  });

const wishlistButtonIn = (screenName: string) =>
  within(screen.getByRole('region', { name: screenName })).getByRole('button', {
    name: `${PRODUCT.name} 찜`,
  });

describe('화면 간 상태 공유', () => {
  it('홈에서 담으면 목록의 같은 상품도 담긴 상태가 된다', async () => {
    const { user } = renderBothScreens();

    await user.click(cartButtonIn('홈'));

    expect(cartButtonIn('목록')).toHaveAttribute('aria-pressed', 'true');
  });

  it('목록에서 빼면 홈의 같은 상품도 빠진다', async () => {
    const { user } = renderBothScreens();

    await user.click(cartButtonIn('홈'));
    await user.click(cartButtonIn('목록'));

    expect(cartButtonIn('홈')).toHaveAttribute('aria-pressed', 'false');
  });

  it('장바구니와 위시리스트는 서로의 상태와 개수를 건드리지 않는다', async () => {
    const { user } = renderBothScreens();

    await user.click(cartButtonIn('홈'));
    await user.click(wishlistButtonIn('목록'));

    expect(cartButtonIn('목록')).toHaveAttribute('aria-pressed', 'true');
    expect(wishlistButtonIn('홈')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('장바구니 1')).toBeInTheDocument();
    expect(screen.getByText('위시리스트 1')).toBeInTheDocument();

    await user.click(wishlistButtonIn('홈'));

    expect(wishlistButtonIn('목록')).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText('위시리스트 0')).toBeInTheDocument();
    expect(cartButtonIn('홈')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('장바구니 1')).toBeInTheDocument();
  });
});

describe('헤더 개수', () => {
  it('담은 개수만큼 늘고 빼면 줄어든다', async () => {
    const { user } = renderBothScreens();

    expect(screen.getByText('장바구니 0')).toBeInTheDocument();

    await user.click(cartButtonIn('홈'));
    expect(screen.getByText('장바구니 1')).toBeInTheDocument();

    await user.click(cartButtonIn('목록'));
    expect(screen.getByText('장바구니 0')).toBeInTheDocument();
  });
});

describe('구독 경계', () => {
  it('장바구니가 바뀌면 장바구니 개수가 다시 그려진다', async () => {
    const { user, onCartCountRender } = renderBothScreens();
    onCartCountRender.mockClear();

    await user.click(cartButtonIn('홈'));

    expect(onCartCountRender).toHaveBeenCalled();
  });

  it('위시리스트만 바뀌면 장바구니 개수는 다시 그리지 않는다', async () => {
    const { user, onCartCountRender } = renderBothScreens();
    onCartCountRender.mockClear();

    await user.click(wishlistButtonIn('홈'));

    expect(onCartCountRender).not.toHaveBeenCalled();
  });
});
