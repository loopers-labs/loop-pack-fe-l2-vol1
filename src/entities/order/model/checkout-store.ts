'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import {
  createValidatedStorage,
  useRestoreStore,
  useStoreRestored,
} from '@/shared/persisted-store';

export const CHECKOUT_STORAGE_KEY = 'commerce-checkout';

const CHECKOUT_STORAGE_VERSION = 1;

export type CheckoutDraftItem = {
  productId: string;
  quantity: number;
};

type CheckoutDraftState = {
  /** 구매하기로 확정한 주문 예정 목록. 장바구니 원본이 아니라 확정 시점의 스냅샷이다. */
  draftItems: CheckoutDraftItem[];
  actions: {
    createCheckoutDraft: (items: CheckoutDraftItem[]) => void;
    clearCheckoutDraft: () => void;
  };
};

type PersistedCheckout = Pick<CheckoutDraftState, 'draftItems'>;

const EMPTY_PERSISTED_CHECKOUT: PersistedCheckout = { draftItems: [] };

/** 주문 API가 요구하는 수량 계약과 같은 기준. 1 이상의 안전한 정수만 허용한다. */
const isValidQuantity = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 1;

/** productId와 수량이 유효한 항목만 남기고, 같은 상품이 중복되면 앞의 것만 남긴다. */
const toValidDraftItems = (value: unknown): CheckoutDraftItem[] => {
  if (!Array.isArray(value)) return [];

  const itemByProductId = new Map<string, CheckoutDraftItem>();

  for (const entry of value) {
    const stored =
      typeof entry === 'object' && entry !== null
        ? (entry as Record<string, unknown>)
        : undefined;
    const productId = stored?.productId;
    const quantity = stored?.quantity;

    if (
      typeof productId === 'string' &&
      productId !== '' &&
      isValidQuantity(quantity) &&
      !itemByProductId.has(productId)
    ) {
      itemByProductId.set(productId, { productId, quantity });
    }
  }

  return [...itemByProductId.values()];
};

/**
 * 구매하기를 누른 순간, 장바구니에서 체크된 항목을 확정한 주문 예정 스냅샷.
 * sessionStorage에 두어 같은 탭의 새로고침·로그인 왕복에 살아남고 탭을 닫으면 사라진다.
 * 서버 checkout session API가 생기면 이 클라이언트 draft를 대체한다.
 */
export const useCheckoutStore = create<CheckoutDraftState>()(
  persist(
    (set) => ({
      draftItems: [],
      actions: {
        createCheckoutDraft: (items) =>
          set({ draftItems: toValidDraftItems(items) }),
        clearCheckoutDraft: () => set({ draftItems: [] }),
      },
    }),
    {
      name: CHECKOUT_STORAGE_KEY,
      version: CHECKOUT_STORAGE_VERSION,
      storage: createValidatedStorage(
        CHECKOUT_STORAGE_VERSION,
        (stored) => ({ draftItems: toValidDraftItems(stored?.draftItems) }),
        'session',
      ),
      skipHydration: true,
      partialize: ({ draftItems }) => ({ draftItems }),
      migrate: () => EMPTY_PERSISTED_CHECKOUT,
    },
  ),
);

export const useRestoreCheckoutDraft = () => useRestoreStore(useCheckoutStore);

/**
 * draft를 selector로 구독한다.
 * 복원 전에는 undefined를 준다. 호출부는 이걸로 복원 대기 상태를 구분한다.
 */
export const useCheckoutDraft = <T>(
  select: (checkoutDraft: Omit<CheckoutDraftState, 'actions'>) => T,
): T | undefined => {
  const restored = useStoreRestored(useCheckoutStore);

  return useCheckoutStore((state) => (restored ? select(state) : undefined));
};

/** 액션은 복원 여부와 무관하므로 복원 게이트를 거치지 않는다 */
export const useCheckoutActions = () =>
  useCheckoutStore((state) => state.actions);
