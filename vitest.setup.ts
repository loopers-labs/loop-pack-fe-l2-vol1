import '@testing-library/jest-dom/vitest';

import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

import { useCartStore } from '@/entities/cart/model/cart-store';
import { useCheckoutStore } from '@/entities/order/model/checkout-store';
import { useWishlistStore } from '@/entities/wishlist/model/wishlist-store';

afterEach(() => {
  cleanup();
  // 저장 형태가 바뀌어도 setup은 그대로이도록 초기 상태로 되돌린다.
  useCartStore.setState(useCartStore.getInitialState());
  useCheckoutStore.setState(useCheckoutStore.getInitialState());
  useWishlistStore.setState(useWishlistStore.getInitialState());
  // 상태를 되돌리면 persist가 저장소에 다시 쓰므로 비우는 건 그다음이어야 한다
  localStorage.clear();
  sessionStorage.clear();
});
