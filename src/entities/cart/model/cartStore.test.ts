// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from 'vitest';
import { getCartStorageKey } from './cartOwner';
import { createCartStore } from './cartStore';

describe('createCartStore', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('같은 상품을 여러 번 담으면 수량을 늘리고 다른 상품은 별도 항목으로 보관한다', () => {
    const store = createCartStore('guest');
    store.getState().setHydrated();

    store.getState().addItem('p1');
    store.getState().addItem('p1');
    store.getState().addItem('p2');

    expect(store.getState().items.get('p1')).toEqual({ id: 'p1', quantity: 2 });
    expect(store.getState().items.get('p2')).toEqual({ id: 'p2', quantity: 1 });
    expect(store.getState().lastAddedId).toBe('p2');
  });

  it('기존 상품과 병합할 때 같은 상품은 수량을 합치고 새 상품은 추가한다', () => {
    const store = createCartStore('user:member-1');
    store.getState().setHydrated();
    store.getState().addItem('p1');
    store.getState().addItem('p1');

    store.getState().mergeItems([
      { id: 'p1', quantity: 3 },
      { id: 'p2', quantity: 1 },
    ]);

    expect(store.getState().items.get('p1')).toEqual({ id: 'p1', quantity: 5 });
    expect(store.getState().items.get('p2')).toEqual({ id: 'p2', quantity: 1 });
    expect(store.getState().lastAddedId).toBe('p1');
  });

  it('상품 제거와 전체 비우기는 나머지 항목과 마지막 담기 상태를 일관되게 갱신한다', () => {
    const store = createCartStore('guest');
    store.getState().setHydrated();
    store.getState().addItem('p1');
    store.getState().addItem('p2');

    store.getState().removeItem('p1');
    expect(store.getState().items.has('p1')).toBe(false);
    expect(store.getState().items.has('p2')).toBe(true);

    store.getState().clearItems();
    expect(store.getState().items.size).toBe(0);
    expect(store.getState().lastAddedId).toBeNull();
  });

  it('owner별 저장 키를 사용해 비회원과 회원 장바구니를 분리한다', () => {
    const guestStore = createCartStore('guest');
    const memberStore = createCartStore('user:member-1');
    guestStore.getState().setHydrated();
    memberStore.getState().setHydrated();

    guestStore.getState().addItem('guest-product');
    memberStore.getState().addItem('member-product');

    expect(localStorage.getItem(getCartStorageKey('guest'))).toContain(
      'guest-product',
    );
    expect(localStorage.getItem(getCartStorageKey('user:member-1'))).toContain(
      'member-product',
    );
    expect(memberStore.getState().items.has('guest-product')).toBe(false);
  });

  it('저장된 장바구니를 같은 owner의 새 store에서 복원한다', async () => {
    const firstStore = createCartStore('guest');
    firstStore.getState().setHydrated();
    firstStore.getState().addItem('p1');
    firstStore.getState().addItem('p1');

    const restoredStore = createCartStore('guest');
    await restoredStore.persist.rehydrate();
    restoredStore.getState().setHydrated();

    expect(restoredStore.getState().items.get('p1')).toEqual({
      id: 'p1',
      quantity: 2,
    });
    expect(restoredStore.getState().lastAddedId).toBeNull();
  });

  it('전체 비우기를 저장해 같은 owner의 새 store에서도 빈 상태를 복원한다', async () => {
    const firstStore = createCartStore('user:member-1');
    firstStore.getState().setHydrated();
    firstStore.getState().addItem('p1');
    firstStore.getState().clearItems();

    const restoredStore = createCartStore('user:member-1');
    await restoredStore.persist.rehydrate();
    restoredStore.getState().setHydrated();

    expect(restoredStore.getState().items.size).toBe(0);
  });

  it('hydration 전에 담은 상품을 저장된 상품과 합쳐 유실하지 않는다', async () => {
    const persistedStore = createCartStore('guest');
    persistedStore.getState().setHydrated();
    persistedStore.getState().addItem('persisted-product');

    const nextStore = createCartStore('guest');
    nextStore.getState().addItem('early-product');
    await nextStore.persist.rehydrate();
    nextStore.getState().setHydrated();

    expect(nextStore.getState().items.has('persisted-product')).toBe(true);
    expect(nextStore.getState().items.has('early-product')).toBe(true);
    expect(nextStore.getState().lastAddedId).toBe('early-product');
  });

  it('예상하지 못한 저장값은 빈 장바구니로 복구한다', async () => {
    localStorage.setItem(getCartStorageKey('guest'), '{broken');
    const store = createCartStore('guest');

    await store.persist.rehydrate();
    store.getState().setHydrated();

    expect(store.getState().items.size).toBe(0);
  });
});
