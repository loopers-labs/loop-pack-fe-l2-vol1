import { renderHook, waitFor } from '@testing-library/react';
import { expect, it } from 'vitest';

import {
  CHECKOUT_STORAGE_KEY,
  useCheckoutDraft,
  useCheckoutStore,
  useRestoreCheckoutDraft,
} from './checkout-store';

const STORAGE_VERSION = 1;

const saveToStorage = (stored: unknown) =>
  sessionStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify(stored));

const saveCurrentVersion = (state: unknown) =>
  saveToStorage({ state, version: STORAGE_VERSION });

const restore = () => useCheckoutStore.persist.rehydrate();

const readStorage = () =>
  JSON.parse(sessionStorage.getItem(CHECKOUT_STORAGE_KEY) ?? 'null') as unknown;

const draftItems = () => useCheckoutStore.getState().draftItems;

const checkoutActions = () => useCheckoutStore.getState().actions;

it('복원 전에는 undefined이고 복원을 시작하면 저장된 draft를 반환한다', async () => {
  saveCurrentVersion({
    draftItems: [{ productId: 'p1', quantity: 2 }],
  });

  const { result: draftBeforeRestore, unmount } = renderHook(() =>
    useCheckoutDraft((checkoutDraft) => checkoutDraft.draftItems),
  );

  expect(draftBeforeRestore.current).toBeUndefined();

  unmount();
  const { result: restoredDraft } = renderHook(() => {
    useRestoreCheckoutDraft();

    return useCheckoutDraft((checkoutDraft) => checkoutDraft.draftItems);
  });

  await waitFor(() => {
    expect(restoredDraft.current).toEqual([{ productId: 'p1', quantity: 2 }]);
  });
});

it('구매를 확정하면 draft를 sessionStorage에 기록하고 localStorage에는 쓰지 않는다', () => {
  checkoutActions().createCheckoutDraft([
    { productId: 'p1', quantity: 2 },
    { productId: 'p3', quantity: 1 },
  ]);

  expect(readStorage()).toEqual({
    state: {
      draftItems: [
        { productId: 'p1', quantity: 2 },
        { productId: 'p3', quantity: 1 },
      ],
    },
    version: STORAGE_VERSION,
  });
  expect(localStorage.getItem(CHECKOUT_STORAGE_KEY)).toBeNull();
});

it('다시 확정하면 이전 draft를 새 목록으로 교체한다', () => {
  checkoutActions().createCheckoutDraft([{ productId: 'p1', quantity: 2 }]);

  checkoutActions().createCheckoutDraft([{ productId: 'p2', quantity: 3 }]);

  expect(draftItems()).toEqual([{ productId: 'p2', quantity: 3 }]);
});

it('저장된 draft를 그대로 되살린다', async () => {
  saveCurrentVersion({
    draftItems: [
      { productId: 'p1', quantity: 2 },
      { productId: 'p3', quantity: 1 },
    ],
  });

  await restore();

  expect(draftItems()).toEqual([
    { productId: 'p1', quantity: 2 },
    { productId: 'p3', quantity: 1 },
  ]);
});

it('draft를 비우면 새로고침 후에도 항목이 남지 않는다', async () => {
  checkoutActions().createCheckoutDraft([{ productId: 'p1', quantity: 1 }]);

  checkoutActions().clearCheckoutDraft();

  // 새 문서처럼 메모리만 초기화하되 clear가 만든 저장값은 보존한다.
  const clearedStorage = sessionStorage.getItem(CHECKOUT_STORAGE_KEY);

  useCheckoutStore.setState(useCheckoutStore.getInitialState());

  if (clearedStorage === null) {
    sessionStorage.removeItem(CHECKOUT_STORAGE_KEY);
  } else {
    sessionStorage.setItem(CHECKOUT_STORAGE_KEY, clearedStorage);
  }

  await restore();

  expect(draftItems()).toEqual([]);
});

it('배열이 아니면 비운다', async () => {
  saveCurrentVersion({ draftItems: 'p1' });

  await restore();

  expect(draftItems()).toEqual([]);
});

it('복원 시 상품 ID가 없거나 문자열이 아니거나 비어 있는 항목은 제거한다', async () => {
  saveCurrentVersion({
    draftItems: [
      { quantity: 1 },
      { productId: 1, quantity: 1 },
      { productId: '', quantity: 1 },
      { productId: 'p2', quantity: 2 },
    ],
  });

  await restore();

  expect(draftItems()).toEqual([{ productId: 'p2', quantity: 2 }]);
});

it.each([
  ['0이면', 0],
  ['음수면', -1],
  ['정수가 아니면', 1.5],
  ['숫자가 아니면', '2'],
  ['없으면', undefined],
  ['안전한 정수 범위 밖이면', Number.MAX_SAFE_INTEGER + 1],
])('복원 시 수량이 %s 그 항목을 빼고 되살린다', async (_, quantity) => {
  saveCurrentVersion({
    draftItems: [
      { productId: 'p1', quantity },
      { productId: 'p2', quantity: 2 },
    ],
  });

  await restore();

  expect(draftItems()).toEqual([{ productId: 'p2', quantity: 2 }]);
});

it('복원 시 같은 상품이 중복되면 앞의 항목만 남긴다', async () => {
  saveCurrentVersion({
    draftItems: [
      { productId: 'p1', quantity: 2 },
      { productId: 'p1', quantity: 5 },
    ],
  });

  await restore();

  expect(draftItems()).toEqual([{ productId: 'p1', quantity: 2 }]);
});

const VALID_STORED_DRAFT = {
  draftItems: [{ productId: 'p1', quantity: 1 }],
};

it.each([
  ['버전이 다르면', { state: VALID_STORED_DRAFT, version: 0 }],
  ['버전이 숫자가 아니면', { state: VALID_STORED_DRAFT, version: '1' }],
  ['버전이 없으면', { state: VALID_STORED_DRAFT }],
])('%s 저장값을 버린다', async (_, stored) => {
  saveToStorage(stored);

  await restore();

  expect(draftItems()).toEqual([]);
});
