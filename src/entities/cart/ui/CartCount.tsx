'use client';

import { useCart } from '../model/cart-store';

export function CartCount() {
  const count = useCart((cart) => cart.items.length);

  // 복원 전에는 담아둔 게 있어도 0으로 보이므로, 숫자 자리를 비워두고 폭만 남긴다
  return (
    <span>
      장바구니 <span className="week05-count">{count}</span>
    </span>
  );
}
