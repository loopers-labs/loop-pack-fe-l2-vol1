import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Profiler } from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { useCartStore } from '@/entities/cart/model/cart-store';
import type { Product } from '@/entities/product';
import { ProductCard } from '@/entities/product';
import { useWishlistStore } from '@/entities/wishlist/model/wishlist-store';
import { CartCount } from '@/features/cart';
import { CartToggleButton } from '@/features/cart';
import { WishlistCount } from '@/features/wishlist';
import { WishlistToggleButton } from '@/features/wishlist';

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

beforeAll(async () => {
  await useCartStore.persist.rehydrate();
  await useWishlistStore.persist.rehydrate();
});

/**
 * 홈과 목록은 같은 ProductCard를 쓰므로 카드를 두 번 렌더한 것이 곧 두 화면이다.
 * 조회·URL 상태를 걷어내고 store 공유만 남긴다.
 */
function renderBothScreens() {
  const onCartCountRender = vi.fn();
  const cardActions = (
    <>
      <WishlistToggleButton productId={PRODUCT.id} productName={PRODUCT.name} />
      <CartToggleButton productId={PRODUCT.id} productName={PRODUCT.name} />
    </>
  );

  render(
    <>
      <Profiler id="cart-count" onRender={onCartCountRender}>
        <CartCount />
      </Profiler>
      <WishlistCount />
      <section aria-label="홈">
        <ProductCard
          product={PRODUCT}
          headingLevel="h2"
          actions={cardActions}
        />
      </section>
      <section aria-label="목록">
        <ProductCard
          product={PRODUCT}
          headingLevel="h3"
          actions={cardActions}
        />
      </section>
    </>,
  );

  return { user: userEvent.setup(), onCartCountRender };
}

// 숫자는 폭을 예약하려고 별도 span에 있어 getByText로는 한 번에 잡히지 않는다
const headerCountText = (label: string) =>
  screen.getByText(new RegExp(`^${label}`)).textContent;

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
    expect(headerCountText('장바구니')).toBe('장바구니 1');
    expect(headerCountText('위시리스트')).toBe('위시리스트 1');

    await user.click(wishlistButtonIn('홈'));

    expect(wishlistButtonIn('목록')).toHaveAttribute('aria-pressed', 'false');
    expect(headerCountText('위시리스트')).toBe('위시리스트 0');
    expect(cartButtonIn('홈')).toHaveAttribute('aria-pressed', 'true');
    expect(headerCountText('장바구니')).toBe('장바구니 1');
  });
});

describe('헤더 개수', () => {
  it('담은 개수만큼 늘고 빼면 줄어든다', async () => {
    const { user } = renderBothScreens();

    expect(headerCountText('장바구니')).toBe('장바구니 0');

    await user.click(cartButtonIn('홈'));
    expect(headerCountText('장바구니')).toBe('장바구니 1');

    await user.click(cartButtonIn('목록'));
    expect(headerCountText('장바구니')).toBe('장바구니 0');
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
