/**
 * 홈과 목록의 store 상태 동기화 테스트
 *
 * Zustand store는 모듈 싱글턴이므로 홈·목록 어디서 읽어도
 * 동일한 상태를 반환해야 한다.
 */
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';

beforeAll(() => {
  vi.stubGlobal('localStorage', {
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  });
});

describe('홈과 목록의 store 상태 동기화', () => {
  beforeEach(() => {
    useCartStore.setState({ items: [] });
    useWishlistStore.setState({ items: [] });
  });

  it('홈에서 담은 상품이 목록 페이지에서도 같은 상태로 보인다', () => {
    // 홈 컴포넌트 역할: 담기 실행
    useCartStore.getState().addItem('p1');

    // 목록 컴포넌트 역할: 같은 store에서 읽기
    const itemsInProductList = useCartStore.getState().items;
    expect(itemsInProductList).toContain('p1');
  });

  it('목록에서 위시리스트 토글 시 홈에서도 같은 상태다', () => {
    // 목록 컴포넌트 역할: 위시리스트 토글
    useWishlistStore.getState().toggleItem('p5');

    // 홈 컴포넌트 역할: 같은 store에서 읽기
    const itemsInHome = useWishlistStore.getState().items;
    expect(itemsInHome).toContain('p5');
  });

  it('페이지 이동 후 store 상태가 유지된다', () => {
    useCartStore.getState().addItem('p1');
    useCartStore.getState().addItem('p2');
    useWishlistStore.getState().toggleItem('p3');

    // 페이지 이동 시뮬레이션: store는 싱글턴이므로 재조회해도 동일
    const cartAfterNavigation = useCartStore.getState().items;
    const wishlistAfterNavigation = useWishlistStore.getState().items;

    expect(cartAfterNavigation).toEqual(['p1', 'p2']);
    expect(wishlistAfterNavigation).toContain('p3');
  });

  it('장바구니와 위시리스트는 서로 독립적이다', () => {
    useCartStore.getState().addItem('p1');
    useWishlistStore.getState().toggleItem('p2');

    expect(useCartStore.getState().items).toContain('p1');
    expect(useCartStore.getState().items).not.toContain('p2');
    expect(useWishlistStore.getState().items).toContain('p2');
    expect(useWishlistStore.getState().items).not.toContain('p1');
  });

  it('헤더 카운트(cart + wishlist)가 두 store에서 각각 파생된다', () => {
    useCartStore.getState().addItem('p1');
    useCartStore.getState().addItem('p2');
    useWishlistStore.getState().toggleItem('p3');

    const cartCount = useCartStore.getState().items.length;
    const wishlistCount = useWishlistStore.getState().items.length;

    expect(cartCount).toBe(2);
    expect(wishlistCount).toBe(1);
  });
});
