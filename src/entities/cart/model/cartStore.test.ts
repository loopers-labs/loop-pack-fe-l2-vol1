import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { useCartStore } from './cartStore';

beforeAll(() => {
  vi.stubGlobal('localStorage', {
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  });
});

describe('cartStore — action', () => {
  beforeEach(() => {
    useCartStore.setState({ items: [] });
  });

  it('초기 상태는 빈 배열이다', () => {
    expect(useCartStore.getState().items).toEqual([]);
  });

  it('addItem은 상품 id를 추가한다', () => {
    useCartStore.getState().addItem('p1');
    expect(useCartStore.getState().items).toContain('p1');
  });

  it('addItem은 같은 id를 중복 추가하지 않는다', () => {
    useCartStore.getState().addItem('p1');
    useCartStore.getState().addItem('p1');
    const count = useCartStore
      .getState()
      .items.filter((id) => id === 'p1').length;
    expect(count).toBe(1);
  });

  it('removeItem은 해당 id를 제거한다', () => {
    useCartStore.getState().addItem('p1');
    useCartStore.getState().removeItem('p1');
    expect(useCartStore.getState().items).not.toContain('p1');
  });

  it('removeItem은 존재하지 않는 id에 대해 아무것도 하지 않는다', () => {
    useCartStore.getState().addItem('p1');
    useCartStore.getState().removeItem('p99');
    expect(useCartStore.getState().items).toEqual(['p1']);
  });

  it('여러 상품을 순서대로 추가할 수 있다', () => {
    useCartStore.getState().addItem('p1');
    useCartStore.getState().addItem('p2');
    useCartStore.getState().addItem('p3');
    expect(useCartStore.getState().items).toEqual(['p1', 'p2', 'p3']);
  });
});

describe('cartStore — 헤더 개수 파생', () => {
  beforeEach(() => {
    useCartStore.setState({ items: [] });
  });

  it('헤더 개수는 items.length로 파생된다 (별도 상태 없음)', () => {
    useCartStore.getState().addItem('p1');
    useCartStore.getState().addItem('p2');
    // cartCount는 items.length를 selector로 읽어야 하며 별도 저장값이 없음
    const cartCount = useCartStore.getState().items.length;
    expect(cartCount).toBe(2);
  });

  it('removeItem 후 개수가 줄어든다', () => {
    useCartStore.getState().addItem('p1');
    useCartStore.getState().addItem('p2');
    useCartStore.getState().removeItem('p1');
    expect(useCartStore.getState().items.length).toBe(1);
  });
});
