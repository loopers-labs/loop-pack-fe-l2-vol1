import { create } from 'zustand';

import {
  createCartSlice,
  type CartSlice,
} from '@/features/products/cart-slice';
import {
  createWishlistSlice,
  type WishlistSlice,
} from '@/features/products/wishlist-slice';

/**
 * 앱 전역 클라이언트 상태. 기능별 slice를 합쳐 하나의 store로 둔다.
 * 한 slice가 커져도 다른 slice를 건드리지 않고, slice끼리 상태를 읽어야 할 때도 같은 store를 본다.
 */
export const useBoundStore = create<CartSlice & WishlistSlice>()((...args) => ({
  ...createCartSlice(...args),
  ...createWishlistSlice(...args),
}));
