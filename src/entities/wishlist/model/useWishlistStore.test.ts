import { beforeEach, describe, expect, it } from 'vitest';

import { useWishlistStore } from './useWishlistStore';

/**
 * 검증 항목 1 — 위시리스트 개수 파생 (단위)
 *
 * 사용자에게 위시리스트는 "내가 찜해 둔 상품들"이다. 몇 개인지와 이 상품이 찜한 것인지,
 * 둘 다 store 에 저장하지 않고 목록에서 파생한다. 그래서 단언 대상은 배열의 모양이 아니라
 * **찜한 상품 수**와 **찜했는지 여부**다.
 *
 * 어디에 몇 개로 표시되는지(헤더·배지)는 이 테스트가 알 바가 아니다. 표시 위치가 바뀌어도
 * 파생 규칙은 그대로여야 하고, 화면과의 배선은 항목 12(통합)가 본다.
 * 장바구니와 서로 새지 않는지도 두 슬라이스를 함께 렌더하는 항목 12에서 확인한다 —
 * entities 는 서로를 몰라야 하므로 여기서 cart 를 부르지 않는다.
 *
 * 찜한 순서는 어디에도 노출되지 않으므로 단언하지 않는다.
 */

/** 찜해 둔 상품 수. */
const wishedCount = () => useWishlistStore.getState().wishlist.length;

/** 이 상품이 찜한 것인지. */
const isWished = (productId: string) => useWishlistStore.getState().wishlist.includes(productId);

/** 사용자가 찜 버튼을 누른 것. */
const pressWishlist = (productId: string) => useWishlistStore.getState().toggleWishlist(productId);

describe('위시리스트', () => {
  beforeEach(() => {
    useWishlistStore.setState({ wishlist: [] });
  });

  it('상품을 찜하면 찜한 상품이 1개가 되고 그 상품은 찜한 것으로 남는다', () => {
    pressWishlist('p1');

    expect(wishedCount()).toBe(1);
    expect(isWished('p1')).toBe(true);
  });

  it('찜한 상품을 다시 누르면 찜이 풀려 찜한 상품이 없어진다', () => {
    pressWishlist('p1');

    pressWishlist('p1');

    expect(wishedCount()).toBe(0);
    expect(isWished('p1')).toBe(false);
  });

  it('서로 다른 상품을 찜하면 찜한 수만큼 늘어난다', () => {
    pressWishlist('p1');
    pressWishlist('p2');

    expect(wishedCount()).toBe(2);
    expect(isWished('p1')).toBe(true);
    expect(isWished('p2')).toBe(true);
  });

  it('여러 개를 찜한 뒤 하나만 풀면 푼 상품만 빠지고 나머지는 찜한 채로 남는다', () => {
    pressWishlist('p1');
    pressWishlist('p2');
    pressWishlist('p3');

    pressWishlist('p2');

    expect(wishedCount()).toBe(2);
    expect(isWished('p2')).toBe(false);
    expect(isWished('p1')).toBe(true);
    expect(isWished('p3')).toBe(true);
  });

  // 경계 — 같은 버튼을 연달아 누르는 경우
  it('같은 상품을 두 번 찜해도 찜한 상품이 2개가 되지는 않는다', () => {
    pressWishlist('p1');
    pressWishlist('p1');

    expect(wishedCount()).toBe(0);
  });

  it('같은 상품을 세 번 누르면 다시 찜한 상태가 된다', () => {
    pressWishlist('p1');
    pressWishlist('p1');
    pressWishlist('p1');

    expect(wishedCount()).toBe(1);
    expect(isWished('p1')).toBe(true);
  });

  // 경계 — 아무것도 찜하지 않은 처음 상태
  it('아무것도 찜하지 않았으면 찜한 상품이 없고 어떤 상품도 찜한 것으로 보이지 않는다', () => {
    expect(wishedCount()).toBe(0);
    expect(isWished('p1')).toBe(false);
  });
});
