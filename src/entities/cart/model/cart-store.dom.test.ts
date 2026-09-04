import { expect, it } from 'vitest';

import { CART_STORAGE_KEY, useCartStore } from './cart-store';

const STORAGE_VERSION = 2;

const saveToStorage = (stored: unknown) =>
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(stored));

const saveCurrentVersion = (state: unknown) =>
  saveToStorage({ state, version: STORAGE_VERSION });

const restore = () => useCartStore.persist.rehydrate();

const readStorage = () =>
  JSON.parse(localStorage.getItem(CART_STORAGE_KEY) ?? 'null') as unknown;

const savedItems = () => useCartStore.getState().items;

const cartActions = () => useCartStore.getState().actions;

it('담거나 빼면 저장소에 현재 목록과 버전을 기록한다', () => {
  cartActions().toggle('p1');
  cartActions().toggle('p2');

  expect(readStorage()).toEqual({
    state: {
      items: [
        { productId: 'p1', quantity: 1, checked: true },
        { productId: 'p2', quantity: 1, checked: true },
      ],
    },
    version: STORAGE_VERSION,
  });

  cartActions().toggle('p1');

  expect(readStorage()).toEqual({
    state: { items: [{ productId: 'p2', quantity: 1, checked: true }] },
    version: STORAGE_VERSION,
  });
});

it('수량·체크 변경을 현재 version 저장값에 반영한다', () => {
  cartActions().toggle('p1');
  cartActions().setQuantity('p1', 3);
  cartActions().toggleChecked('p1');

  expect(readStorage()).toEqual({
    state: { items: [{ productId: 'p1', quantity: 3, checked: false }] },
    version: STORAGE_VERSION,
  });
});

it('변경할 상품이 없거나 값이 같으면 목록을 바꾸지 않는다', () => {
  cartActions().toggle('p1');

  cartActions().setQuantity('p2', 3);
  cartActions().setQuantity('p1', 1);
  cartActions().toggleChecked('p2');
  cartActions().removeItems(['p2']);

  expect(savedItems()).toEqual([
    { productId: 'p1', quantity: 1, checked: true },
  ]);
});

it('저장된 목록을 체크 여부까지 그대로 되살린다', async () => {
  saveCurrentVersion({
    items: [
      { productId: 'p1', quantity: 2, checked: false },
      { productId: 'p2', quantity: 1, checked: true },
    ],
  });

  await restore();

  expect(savedItems()).toEqual([
    { productId: 'p1', quantity: 2, checked: false },
    { productId: 'p2', quantity: 1, checked: true },
  ]);
});

it('되살린 뒤에도 담기와 빼기가 동작한다', async () => {
  saveCurrentVersion({
    items: [{ productId: 'p1', quantity: 1, checked: true }],
  });
  await restore();

  cartActions().toggle('p2');
  cartActions().toggle('p1');

  expect(savedItems()).toEqual([
    { productId: 'p2', quantity: 1, checked: true },
  ]);
});

it('version 1 저장값은 버리지 않고 수량 1·선택된 항목으로 되살린다', async () => {
  saveToStorage({ state: { productIds: ['p1', 'p2'] }, version: 1 });

  await restore();

  expect(savedItems()).toEqual([
    { productId: 'p1', quantity: 1, checked: true },
    { productId: 'p2', quantity: 1, checked: true },
  ]);
});

it('version 1의 잘못된 원소와 중복은 걸러서 옮긴다', async () => {
  saveToStorage({ state: { productIds: ['p1', 1, '', 'p1'] }, version: 1 });

  await restore();

  expect(savedItems()).toEqual([
    { productId: 'p1', quantity: 1, checked: true },
  ]);
});

const OUTDATED_STATE = { productIds: ['p1'] };

it.each([
  ['version 1보다 오래되면', { state: OUTDATED_STATE, version: 0 }],
  ['버전이 숫자가 아니면', { state: OUTDATED_STATE, version: '1' }],
  ['버전이 없으면', { state: OUTDATED_STATE }],
])('%s 저장값을 버린다', async (_, stored) => {
  saveToStorage(stored);

  await restore();

  expect(savedItems()).toEqual([]);
});

it('배열이 아니면 비운다', async () => {
  saveCurrentVersion({ items: 'p1' });

  await restore();

  expect(savedItems()).toEqual([]);
});

it('상품 ID가 없거나 빈 문자열인 항목은 빼고 되살린다', async () => {
  saveCurrentVersion({
    items: [
      { quantity: 1, checked: true },
      { productId: '', quantity: 1, checked: true },
      { productId: 'p2', quantity: 1, checked: true },
    ],
  });

  await restore();

  expect(savedItems()).toEqual([
    { productId: 'p2', quantity: 1, checked: true },
  ]);
});

it.each([
  ['0이면', 0],
  ['음수면', -1],
  ['정수가 아니면', 1.5],
  ['숫자가 아니면', '2'],
  ['없으면', undefined],
  ['안전한 정수 범위 밖이면', Number.MAX_SAFE_INTEGER + 1],
])('수량이 %s 그 항목을 빼고 되살린다', async (_, quantity) => {
  saveCurrentVersion({
    items: [
      { productId: 'p1', quantity, checked: true },
      { productId: 'p2', quantity: 2, checked: true },
    ],
  });

  await restore();

  expect(savedItems()).toEqual([
    { productId: 'p2', quantity: 2, checked: true },
  ]);
});

it.each([
  ['문자열이면', 'true'],
  ['숫자면', 1],
  ['없으면', undefined],
])(
  'checked가 boolean이 아니고 %s 그 항목을 빼고 되살린다',
  async (_, checked) => {
    saveCurrentVersion({
      items: [
        { productId: 'p1', quantity: 1, checked },
        { productId: 'p2', quantity: 1, checked: false },
      ],
    });

    await restore();

    expect(savedItems()).toEqual([
      { productId: 'p2', quantity: 1, checked: false },
    ]);
  },
);

it('같은 상품이 중복되면 앞의 항목만 남긴다', async () => {
  saveCurrentVersion({
    items: [
      { productId: 'p1', quantity: 2, checked: true },
      { productId: 'p1', quantity: 5, checked: true },
    ],
  });

  await restore();

  expect(savedItems()).toEqual([
    { productId: 'p1', quantity: 2, checked: true },
  ]);
});
