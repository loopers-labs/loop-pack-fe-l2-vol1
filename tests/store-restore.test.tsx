import { act, render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';

import {
  CART_STORAGE_KEY,
  useCartStore,
} from '@/entities/cart/model/cart-store';
import {
  useWishlistStore,
  WISHLIST_STORAGE_KEY,
} from '@/entities/wishlist/model/wishlist-store';
import { CartCount } from '@/features/cart';
import { CartToggleButton } from '@/features/cart';
import { WishlistCount } from '@/features/wishlist';
import { WishlistToggleButton } from '@/features/wishlist';

const PRODUCT_NAME = '사이드 테이블';

// 숫자는 폭을 예약하려고 별도 span에 있어 getByText로는 한 번에 잡히지 않는다
const headerCountText = (label: string) =>
  screen.getByText(new RegExp(`^${label}`)).textContent;

/**
 * persist의 `hasHydrated`는 한 번 참이 되면 되돌릴 방법이 없다.
 * 복원 전 화면은 아직 아무도 복원을 부르지 않은 모듈에서만 만들 수 있어 파일을 따로 둔다.
 */
it('복원 전에는 개수를 감추고 버튼을 잠그며, 복원되면 함께 풀린다', async () => {
  const saved = JSON.stringify({ state: { productIds: ['p9'] }, version: 1 });

  localStorage.setItem(CART_STORAGE_KEY, saved);
  localStorage.setItem(WISHLIST_STORAGE_KEY, saved);

  render(
    <>
      <CartCount />
      <WishlistCount />
      <CartToggleButton productId="p9" productName={PRODUCT_NAME} />
      <WishlistToggleButton productId="p9" productName={PRODUCT_NAME} />
    </>,
  );

  const cartToggle = screen.getByRole('button', {
    name: `${PRODUCT_NAME} 담기`,
  });
  const wishlistToggle = screen.getByRole('button', {
    name: `${PRODUCT_NAME} 찜`,
  });

  expect(headerCountText('장바구니')).not.toMatch(/\d/);
  expect(headerCountText('위시리스트')).not.toMatch(/\d/);
  expect(cartToggle).toBeDisabled();
  expect(wishlistToggle).toBeDisabled();
  expect(cartToggle).not.toHaveAttribute('aria-pressed');
  expect(wishlistToggle).not.toHaveAttribute('aria-pressed');

  await act(async () => {
    await useCartStore.persist.rehydrate();
    await useWishlistStore.persist.rehydrate();
  });

  expect(headerCountText('장바구니')).toBe('장바구니 1');
  expect(headerCountText('위시리스트')).toBe('위시리스트 1');
  expect(cartToggle).toBeEnabled();
  expect(wishlistToggle).toBeEnabled();
  expect(cartToggle).toHaveAttribute('aria-pressed', 'true');
  expect(wishlistToggle).toHaveAttribute('aria-pressed', 'true');
});
