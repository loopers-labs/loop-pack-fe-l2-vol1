import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { WishlistItem } from '@/entities/wishlist/model/wishlist'
import { isRecord } from '@/shared/lib/is-record'

// 장바구니가 수량 때문에 갈라지면서 공용 팩토리를 버렸고, 위시리스트도 독립 구현이 됐다.
// 다만 찜은 켜고 끄는 동작이라 toggle을 그대로 둔다. 갈라진 것은 수량뿐이고,
// 소유자별로 목록을 나눠 드는 구조도 표시 정보를 함께 드는 것도 장바구니와 같다.
export type WishlistStore = {
  ownerId: string | null
  byOwner: Record<string, WishlistItem[]>
  setOwner: (ownerId: string | null) => void
  toggle: (product: WishlistItem) => void
}

// 표시에 쓰는 필드만 골라 담는다. 이유는 cart-store의 toCartItem과 같다 —
// 구조적 타이핑이라 필드가 더 많은 Product가 그대로 들어온다.
const toWishlistItem = (product: WishlistItem): WishlistItem => ({
  id: product.id,
  brand: product.brand,
  name: product.name,
  price: product.price,
  image: product.image,
})

// 소유자가 없거나 찜한 것이 없을 때 항상 같은 참조를 돌려준다.
const EMPTY_ITEMS: WishlistItem[] = []

export const selectWishlistItems = (state: WishlistStore): WishlistItem[] =>
  state.ownerId === null ? EMPTY_ITEMS : (state.byOwner[state.ownerId] ?? EMPTY_ITEMS)

export const selectWishlistCount = (state: WishlistStore): number =>
  selectWishlistItems(state).length

// 찜 버튼이 "지금 찜할 수 있는가"를 묻는 자리. 이유는 cart-store의 selectHasCartOwner와 같다.
export const selectHasWishlistOwner = (state: WishlistStore): boolean => state.ownerId !== null

export const selectIsWishlisted =
  (productId: string) =>
  (state: WishlistStore): boolean =>
    selectWishlistItems(state).some((item) => item.id === productId)

// 미로그인 상태에서는 찜할 수 없다. 찜 버튼이 로그인으로 보내지만,
// store가 스스로 막아야 주인 없는 목록이 생기지 않는다.
const updateItems = (
  state: WishlistStore,
  update: (items: WishlistItem[]) => WishlistItem[],
): Partial<WishlistStore> => {
  const { ownerId } = state
  if (ownerId === null) {
    return {}
  }

  return {
    byOwner: { ...state.byOwner, [ownerId]: update(state.byOwner[ownerId] ?? EMPTY_ITEMS) },
  }
}

const isWishlistItem = (value: unknown): value is WishlistItem =>
  isRecord(value) &&
  typeof value.id === 'string' &&
  typeof value.brand === 'string' &&
  typeof value.name === 'string' &&
  typeof value.image === 'string' &&
  typeof value.price === 'number'

// 저장값이 손상·조작됐을 때 읽을 수 있는 항목만 남긴다.
const toValidByOwner = (persisted: unknown): Record<string, WishlistItem[]> => {
  if (!isRecord(persisted) || !isRecord(persisted.byOwner)) {
    return {}
  }

  const byOwner: Record<string, WishlistItem[]> = {}
  for (const [ownerId, items] of Object.entries(persisted.byOwner)) {
    byOwner[ownerId] = Array.isArray(items) ? items.filter(isWishlistItem) : []
  }

  return byOwner
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set) => ({
      ownerId: null,
      byOwner: {},

      setOwner: (ownerId) => set({ ownerId }),

      toggle: (product) =>
        set((state) =>
          updateItems(state, (items) =>
            items.some((item) => item.id === product.id)
              ? items.filter((item) => item.id !== product.id)
              : [...items, toWishlistItem(product)],
          ),
        ),
    }),
    {
      name: 'wishlist',
      // v2는 id만 들고 있어 위시리스트 화면에서 카드를 그릴 수 없다. 이유는 cart-store와 같다.
      version: 3,
      // ownerId는 저장하지 않는다. 이유는 cart-store와 같다.
      partialize: (state) => ({ byOwner: state.byOwner }),
      migrate: () => ({ byOwner: {} }),
      merge: (persisted, current) => ({ ...current, byOwner: toValidByOwner(persisted) }),
    },
  ),
)
