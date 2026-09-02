// Public API — selector 훅만 공개, store 인스턴스는 숨긴다.
export {
  useIsInCart,
  useCartCount,
  useCartIds,
  useToggleCart,
  useClearCart,
  useCaptureCartSnapshot,
  useRemoveCartSnapshot,
} from './model/store'
export type { CartItemSnapshot } from './model/store'
