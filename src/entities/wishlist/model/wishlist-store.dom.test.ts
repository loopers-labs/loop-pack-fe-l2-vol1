import { expect, it } from 'vitest';

import { useWishlistStore, WISHLIST_STORAGE_KEY } from './wishlist-store';

const STORAGE_VERSION = 1;

const saveToStorage = (stored: unknown) =>
  localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(stored));

const saveCurrentVersion = (state: unknown) =>
  saveToStorage({ state, version: STORAGE_VERSION });

const restore = () => useWishlistStore.persist.rehydrate();

const readStorage = () =>
  JSON.parse(localStorage.getItem(WISHLIST_STORAGE_KEY) ?? 'null') as unknown;

const savedProductIds = () => useWishlistStore.getState().productIds;

it('찜하거나 풀면 저장소에 현재 목록과 버전을 기록한다', () => {
  useWishlistStore.getState().actions.toggle('p1');

  expect(readStorage()).toEqual({
    state: { productIds: ['p1'] },
    version: STORAGE_VERSION,
  });

  useWishlistStore.getState().actions.toggle('p1');

  expect(readStorage()).toEqual({
    state: { productIds: [] },
    version: STORAGE_VERSION,
  });
});

it('저장된 목록을 그대로 되살리고 이어서 찜할 수 있다', async () => {
  saveCurrentVersion({ productIds: ['p1', 'p2'] });

  await restore();

  expect(savedProductIds()).toEqual(['p1', 'p2']);

  useWishlistStore.getState().actions.toggle('p1');

  expect(savedProductIds()).toEqual(['p2']);
});

it.each([
  ['버전이 다르면', { state: { productIds: ['p1'] }, version: 0 }],
  ['버전이 없으면', { state: { productIds: ['p1'] } }],
])('%s 저장값을 버린다', async (_, stored) => {
  saveToStorage(stored);

  await restore();

  expect(savedProductIds()).toEqual([]);
});

it.each([
  ['문자열 배열이 아니면', 'p1', []],
  ['원소 하나라도 문자열이 아니면', ['p1', 1], []],
  ['중복으로 찜했으면 하나로 줄여', ['p1', 'p1'], ['p1']],
])('%s 복원한다', async (_, productIds, expected) => {
  saveCurrentVersion({ productIds });

  await restore();

  expect(savedProductIds()).toEqual(expected);
});
