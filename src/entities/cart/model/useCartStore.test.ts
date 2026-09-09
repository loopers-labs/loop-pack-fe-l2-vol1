import { beforeEach, describe, expect, it } from 'vitest';
import { useCartStore } from './useCartStore';

/* AI-generated : week06-fsd.md 기준 — useWishlistStore.test.ts와 동일한 패턴(같은 store 구현)으로 작성 */
describe('useCartStore', () => {
  beforeEach(() => {
    useCartStore.setState({ productIds: new Set() });
  });

  it('처음엔 빈 장바구니로 시작한다', () => {
    expect(useCartStore.getState().productIds.size).toBe(0);
  });

  it('setSingleIdInCart는 없던 id를 추가한다', () => {
    useCartStore.getState().setSingleIdInCart('p1');

    expect(useCartStore.getState().productIds.has('p1')).toBe(true);
  });

  it('setSingleIdInCart는 이미 있는 id면 제거한다 (토글)', () => {
    useCartStore.getState().setSingleIdInCart('p1');
    useCartStore.getState().setSingleIdInCart('p1');

    expect(useCartStore.getState().productIds.has('p1')).toBe(false);
  });

  it('여러 id를 서로 독립적으로 관리한다', () => {
    useCartStore.getState().setSingleIdInCart('p1');
    useCartStore.getState().setSingleIdInCart('p2');

    const { productIds } = useCartStore.getState();
    expect(productIds.has('p1')).toBe(true);
    expect(productIds.has('p2')).toBe(true);
    expect(productIds.size).toBe(2);
  });

  // 주문 완료와 로그아웃이 부른다. 담긴 항목과 주문한 항목이 어긋나지 않게 하는 자리다
  it('clearCart는 담긴 목록을 모두 비운다', () => {
    useCartStore.getState().setSingleIdInCart('p1');
    useCartStore.getState().setSingleIdInCart('p2');

    useCartStore.getState().clearCart();

    expect(useCartStore.getState().productIds.size).toBe(0);
  });

  it('clearCart는 이미 비어 있어도 안전하다', () => {
    useCartStore.getState().clearCart();

    expect(useCartStore.getState().productIds.size).toBe(0);
  });

  it('clearCart 뒤에도 담기를 다시 쓸 수 있다', () => {
    useCartStore.getState().setSingleIdInCart('p1');
    useCartStore.getState().clearCart();
    useCartStore.getState().setSingleIdInCart('p3');

    expect(useCartStore.getState().productIds.has('p3')).toBe(true);
    expect(useCartStore.getState().productIds.has('p1')).toBe(false);
  });
});
