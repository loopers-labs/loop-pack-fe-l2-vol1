import { expect, it } from 'vitest';

import { CART_STORAGE_KEY, useCartStore } from './cart-store';

const STORAGE_VERSION = 1;

const saveToStorage = (stored: unknown) =>
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(stored));

const saveCurrentVersion = (state: unknown) =>
  saveToStorage({ state, version: STORAGE_VERSION });

const restore = () => useCartStore.persist.rehydrate();

const readStorage = () =>
  JSON.parse(localStorage.getItem(CART_STORAGE_KEY) ?? 'null') as unknown;

const savedProductIds = () => useCartStore.getState().productIds;

it('담거나 빼면 저장소에 현재 목록과 버전을 기록한다', () => {
  useCartStore.getState().actions.toggle('p1');
  useCartStore.getState().actions.toggle('p2');

  expect(readStorage()).toEqual({
    state: { productIds: ['p1', 'p2'] },
    version: STORAGE_VERSION,
  });

  useCartStore.getState().actions.toggle('p1');

  expect(readStorage()).toEqual({
    state: { productIds: ['p2'] },
    version: STORAGE_VERSION,
  });
});

it('저장된 목록을 그대로 되살린다', async () => {
  saveCurrentVersion({ productIds: ['p1', 'p2'] });

  await restore();

  expect(savedProductIds()).toEqual(['p1', 'p2']);
});

it('되살린 뒤에도 담기와 빼기가 동작한다', async () => {
  saveCurrentVersion({ productIds: ['p1'] });
  await restore();

  useCartStore.getState().actions.toggle('p2');
  useCartStore.getState().actions.toggle('p1');

  expect(savedProductIds()).toEqual(['p2']);
});

const OUTDATED_STATE = { productIds: ['p1'] };

it.each([
  ['버전이 다르면', { state: OUTDATED_STATE, version: 0 }],
  ['버전이 숫자가 아니면', { state: OUTDATED_STATE, version: '1' }],
  ['버전이 없으면', { state: OUTDATED_STATE }],
])('%s 저장값을 버린다', async (_, stored) => {
  saveToStorage(stored);

  await restore();

  expect(savedProductIds()).toEqual([]);
});

it('문자열 배열이 아니면 비운다', async () => {
  saveCurrentVersion({ productIds: 'p1' });

  await restore();

  expect(savedProductIds()).toEqual([]);
});

it('원소 하나라도 문자열이 아니면 비운다', async () => {
  saveCurrentVersion({ productIds: ['p1', 1] });

  await restore();

  expect(savedProductIds()).toEqual([]);
});

it('중복으로 담긴 상품은 하나로 줄인다', async () => {
  saveCurrentVersion({ productIds: ['p1', 'p1'] });

  await restore();

  expect(savedProductIds()).toEqual(['p1']);
});
