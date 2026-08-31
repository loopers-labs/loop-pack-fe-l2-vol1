/**
 * 담긴 상품 목록에 한 상품을 넣거나 뺀다.
 *
 * store 안에 두지 않고 꺼낸 이유는 이 규칙이 저장과 무관하기 때문이다. `persist` 로 감싼
 * store 를 거쳐야만 부를 수 있으면, DOM 이 없는 환경에서 이 규칙 하나를 확인할 때마다
 * 저장소가 없다는 경고를 낸다. 규칙은 node 에서, `persist` 왕복은 jsdom 에서 본다.
 *
 * 슬라이스 안에서만 쓰고 Public API(`entities/cart/index.ts`)로는 내보내지 않는다.
 * wishlist 와 모양이 같아도 shared 로 합치지 않는다 — 슬라이스를 통째로 지울 때
 * 주인 없는 헬퍼가 남는다.
 */
export const toggleCartItem = (cart: string[], productId: string): string[] =>
  cart.includes(productId) ? cart.filter((id) => id !== productId) : [...cart, productId];
