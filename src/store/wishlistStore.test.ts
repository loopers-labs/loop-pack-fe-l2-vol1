import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { useWishlistStore } from '@/store/wishlistStore';

beforeAll(() => {
  vi.stubGlobal('localStorage', {
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  });
});

describe('wishlistStore — action', () => {
  beforeEach(() => {
    useWishlistStore.setState({ items: [] });
  });

  it('초기 상태는 빈 배열이다', () => {
    expect(useWishlistStore.getState().items).toEqual([]);
  });

  it('toggleItem은 없는 상품을 추가한다', () => {
    useWishlistStore.getState().toggleItem('p1');
    expect(useWishlistStore.getState().items).toContain('p1');
  });

  it('toggleItem은 이미 있는 상품을 제거한다', () => {
    useWishlistStore.getState().toggleItem('p1');
    useWishlistStore.getState().toggleItem('p1');
    expect(useWishlistStore.getState().items).not.toContain('p1');
  });

  it('toggleItem을 홀수 번 호출하면 추가 상태다', () => {
    useWishlistStore.getState().toggleItem('p1');
    useWishlistStore.getState().toggleItem('p1');
    useWishlistStore.getState().toggleItem('p1');
    expect(useWishlistStore.getState().items).toContain('p1');
  });

  it('여러 상품을 독립적으로 토글할 수 있다', () => {
    useWishlistStore.getState().toggleItem('p1');
    useWishlistStore.getState().toggleItem('p2');
    useWishlistStore.getState().toggleItem('p1'); // p1 제거
    expect(useWishlistStore.getState().items).not.toContain('p1');
    expect(useWishlistStore.getState().items).toContain('p2');
  });
});

describe('wishlistStore — 헤더 개수 파생', () => {
  beforeEach(() => {
    useWishlistStore.setState({ items: [] });
  });

  it('헤더 개수는 items.length로 파생된다 (별도 상태 없음)', () => {
    useWishlistStore.getState().toggleItem('p1');
    useWishlistStore.getState().toggleItem('p2');
    const wishlistCount = useWishlistStore.getState().items.length;
    expect(wishlistCount).toBe(2);
  });

  it('토글로 제거 후 개수가 줄어든다', () => {
    useWishlistStore.getState().toggleItem('p1');
    useWishlistStore.getState().toggleItem('p2');
    useWishlistStore.getState().toggleItem('p1');
    expect(useWishlistStore.getState().items.length).toBe(1);
  });
});
