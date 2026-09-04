'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import {
  createValidatedStorage,
  useRestoreStore,
  useStoreRestored,
} from '@/shared/persisted-store';

export const CART_STORAGE_KEY = 'commerce-cart';

const CART_STORAGE_VERSION = 2;

export type CartItem = {
  productId: string;
  quantity: number;
  checked: boolean;
};

type CartState = {
  items: CartItem[];
  /** 액션은 바뀌지 않아 상태가 아니다. 한 객체로 묶어 훅 하나로 내준다 */
  actions: {
    toggle: (productId: string) => void;
    toggleChecked: (productId: string) => void;
    setQuantity: (productId: string, quantity: number) => void;
    removeItems: (productIds: string[]) => void;
  };
};

type PersistedCart = Pick<CartState, 'items'>;

const EMPTY_PERSISTED_CART: PersistedCart = { items: [] };

/** 주문 API가 요구하는 수량 계약과 같은 기준. 1 이상의 안전한 정수만 허용한다. */
const isValidQuantity = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 1;

/**
 * 유효한 상품 ID만 남긴다. version 1 저장값을 옮길 때도 같은 기준을 쓴다.
 */
const toValidProductIds = (value: unknown) =>
  Array.isArray(value)
    ? [
        ...new Set(
          value.filter(
            (id): id is string => typeof id === 'string' && id !== '',
          ),
        ),
      ]
    : [];

/** productId·수량·checked가 유효한 항목만 남기고, 같은 상품이 중복되면 앞의 것만 남긴다. */
const toValidItems = (value: unknown): CartItem[] => {
  if (!Array.isArray(value)) return [];

  const itemByProductId = new Map<string, CartItem>();

  for (const entry of value) {
    const stored =
      typeof entry === 'object' && entry !== null
        ? (entry as Record<string, unknown>)
        : undefined;
    const productId = stored?.productId;
    const quantity = stored?.quantity;
    const checked = stored?.checked;

    if (
      typeof productId === 'string' &&
      productId !== '' &&
      isValidQuantity(quantity) &&
      typeof checked === 'boolean' &&
      !itemByProductId.has(productId)
    ) {
      itemByProductId.set(productId, { productId, quantity, checked });
    }
  }

  return [...itemByProductId.values()];
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      actions: {
        toggle: (productId) =>
          set((state) => ({
            items: state.items.some((item) => item.productId === productId)
              ? state.items.filter((item) => item.productId !== productId)
              : [...state.items, { productId, quantity: 1, checked: true }],
          })),
        toggleChecked: (productId) => {
          if (!get().items.some((item) => item.productId === productId)) return;

          set((state) => ({
            items: state.items.map((item) =>
              item.productId === productId
                ? { ...item, checked: !item.checked }
                : item,
            ),
          }));
        },
        setQuantity: (productId, quantity) => {
          if (!isValidQuantity(quantity)) return;

          const item = get().items.find((item) => item.productId === productId);

          if (!item || item.quantity === quantity) return;

          set((state) => ({
            items: state.items.map((item) =>
              item.productId === productId ? { ...item, quantity } : item,
            ),
          }));
        },
        removeItems: (productIds) => {
          const items = get().items;

          if (!items.some((item) => productIds.includes(item.productId)))
            return;

          set({
            items: items.filter((item) => !productIds.includes(item.productId)),
          });
        },
      },
    }),
    {
      name: CART_STORAGE_KEY,
      version: CART_STORAGE_VERSION,
      storage: createValidatedStorage(CART_STORAGE_VERSION, (stored) => ({
        items: toValidItems(stored?.items),
      })),
      skipHydration: true,
      partialize: ({ items }) => ({ items }),
      /**
       * 저장값은 코드보다 오래 살아남는다. version 1은 수량 없는 ID 배열이므로
       * 버리지 않고 수량 1에 선택된 항목으로 옮긴다. 그 밖의 알 수 없는 버전은 버린다.
       */
      migrate: (persisted, version) => {
        if (version === 1) {
          const storedV1 = persisted as { productIds?: unknown } | null;

          return {
            items: toValidProductIds(storedV1?.productIds).map((productId) => ({
              productId,
              quantity: 1,
              checked: true,
            })),
          };
        }

        return EMPTY_PERSISTED_CART;
      },
    },
  ),
);

export const useRestoreCart = () => useRestoreStore(useCartStore);

/**
 * 담긴 상품을 selector로 구독한다.
 * 복원 전에는 undefined를 준다. 호출부는 이걸로 복원 대기 상태를 구분한다.
 */
export const useCart = <T>(
  select: (cart: Omit<CartState, 'actions'>) => T,
): T | undefined => {
  const restored = useStoreRestored(useCartStore);

  return useCartStore((state) => (restored ? select(state) : undefined));
};

/** 액션은 복원 여부와 무관하므로 복원 게이트를 거치지 않는다 */
export const useCartActions = () => useCartStore((state) => state.actions);
