import { ADDRESSES, CART, MEMBER } from './data';
import type { CheckoutState } from './types';

const SHIPPING_FEE = 3000;
const FREE_SHIPPING_THRESHOLD = 50000;
const REMOTE_AREA_SURCHARGE = 3000;
const VIP_DISCOUNT_RATE = 0.1;

export function getOrderAmount(state: CheckoutState) {
  const address =
    ADDRESSES.find((a) => a.id === state.addressId) ?? ADDRESSES[0];

  // ── 배송비 정책 ──────────────────────────────
  const itemTotal = CART.reduce((sum, it) => sum + it.price * it.quantity, 0);
  let shippingFee = SHIPPING_FEE;
  if (itemTotal >= FREE_SHIPPING_THRESHOLD) shippingFee = 0;
  if (address.isRemote) shippingFee += REMOTE_AREA_SURCHARGE;

  // ── 쿠폰 / 적립금 정책 ───────────────────────
  const couponDiscount = state.appliedCoupon ? state.appliedCoupon.discount : 0;
  const pointDiscount = state.usePoint
    ? Math.min(state.pointInput, MEMBER.point, itemTotal)
    : 0;

  // ── 최종 금액 (VIP면 분기) ────────────────────
  const calculatedPrice =
    itemTotal + shippingFee - couponDiscount - pointDiscount;
  const finalPrice =
    MEMBER.grade === 'VIP'
      ? Math.round(calculatedPrice * (1 - VIP_DISCOUNT_RATE))
      : calculatedPrice;

  return { itemTotal, shippingFee, couponDiscount, pointDiscount, finalPrice };
}
