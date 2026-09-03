import { beforeEach, describe, expect, it } from 'vitest';

import { useWishlistStore } from './useWishlistStore';

/**
 * 검증 항목 1 (분리) — 위시리스트 `persist` 왕복 (통합, jsdom)
 *
 * 파생 규칙은 `toggleWishlistItem.test.ts` 가 node 에서 본다. 여기서 보는 것은 저장·복구다.
 * 나눈 근거는 `entities/cart/model/useCartStore.persist.dom.test.ts` 주석에 적었다.
 *
 * cart 와 저장 자리가 갈리는지(`commerce-cart` / `commerce-wishlist`)는 여기서 보지 않는다 —
 * entities 는 서로를 몰라야 하고, 두 슬라이스가 함께 올라간 화면은 항목 12 가 본다.
 */

/** 이 슬라이스가 저장소에 쓰는 자리. */
const WISHLIST_STORAGE_KEY = 'commerce-wishlist';

/** 사용자가 찜 버튼을 누른 것. */
const pressWishlist = (productId: string) => useWishlistStore.getState().toggleWishlist(productId);

/** 직전 방문이 저장소에 남긴 것. */
const lastVisitLeft = () => localStorage.getItem(WISHLIST_STORAGE_KEY);

/** 저장소에 남은 것만 들고 다시 들어온 것. 비우는 것 자체가 저장을 부르므로 순서가 중요하다. */
const revisitWith = async (saved: string | null) => {
  useWishlistStore.setState({ wishlist: [] });

  if (saved === null) {
    localStorage.removeItem(WISHLIST_STORAGE_KEY);
  } else {
    localStorage.setItem(WISHLIST_STORAGE_KEY, saved);
  }

  await useWishlistStore.persist.rehydrate();
};

describe('위시리스트를 다시 들어와도 기억하는가', () => {
  beforeEach(() => {
    useWishlistStore.setState({ wishlist: [] });
    localStorage.clear();
  });

  it('찜하면 브라우저 저장소에 그 상품이 남는다', () => {
    pressWishlist('p1');

    expect(lastVisitLeft()).toContain('p1');
  });

  it('찜해 둔 채로 다시 들어오면 찜한 상품이 그대로 있다', async () => {
    pressWishlist('p1');
    pressWishlist('p2');

    await revisitWith(lastVisitLeft());

    expect(useWishlistStore.getState().wishlist).toContain('p1');
    expect(useWishlistStore.getState().wishlist).toContain('p2');
  });

  // 경계 — 푼 것도 저장돼야 한다. 아니면 풀었는데 다시 들어오면 살아 있다.
  it('찜을 푼 상품은 다시 들어와도 찜한 상태가 아니다', async () => {
    pressWishlist('p1');
    pressWishlist('p2');
    pressWishlist('p1');

    await revisitWith(lastVisitLeft());

    expect(useWishlistStore.getState().wishlist).not.toContain('p1');
    expect(useWishlistStore.getState().wishlist).toContain('p2');
  });

  // 경계 — 처음 방문
  it('저장소에 아무것도 없으면 빈 위시리스트로 시작한다', async () => {
    await revisitWith(null);

    expect(useWishlistStore.getState().wishlist).toHaveLength(0);
  });
});
