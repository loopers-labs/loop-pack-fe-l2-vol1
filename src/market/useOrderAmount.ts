import { useState } from 'react';

import type { CheckoutState } from './checkoutReducer';
import { ADDRESSES, CART, MEMBER } from './data';

export function useOrderAmount(state: CheckoutState) {
  const member = MEMBER;
  const cart = CART;
  const address =
    ADDRESSES.find((a) => a.id === state.addressId) ?? ADDRESSES[0];

  // ── 배송비 정책 ──────────────────────────────
  const itemTotal = cart.reduce((sum, it) => sum + it.price * it.quantity, 0);
  let shippingFee = 3000;
  if (itemTotal >= 50000) shippingFee = 0;
  if (address.isRemote) shippingFee += 3000;

  // ── 쿠폰 / 적립금 정책 ───────────────────────
  const couponDiscount = state.appliedCoupon ? state.appliedCoupon.discount : 0;
  const pointDiscount = state.usePoint
    ? Math.min(state.pointInput, member.point, itemTotal)
    : 0;

  // 최종 금액을 첫 렌더 값으로 고정한다 (원본 동작 보존 — 의도된 버그).
  const [finalPrice] = useState(
    itemTotal + shippingFee - couponDiscount - pointDiscount,
  );

  return { itemTotal, shippingFee, couponDiscount, pointDiscount, finalPrice };
}
