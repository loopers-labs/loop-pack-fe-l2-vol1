/**
 * 찜한 상품 목록에 한 상품을 넣거나 뺀다.
 *
 * cart 의 `toggleCartItem` 과 같은 이유로 store 밖에 둔다 — 저장과 무관한 순수 규칙이라
 * `persist` 를 거치지 않고 node 에서 확인한다. 자세한 근거는 그쪽 주석에 적었다.
 *
 * 슬라이스 안에서만 쓰고 Public API 로는 내보내지 않는다.
 */
export const toggleWishlistItem = (wishlist: string[], productId: string): string[] =>
  wishlist.includes(productId) ? wishlist.filter((id) => id !== productId) : [...wishlist, productId];
