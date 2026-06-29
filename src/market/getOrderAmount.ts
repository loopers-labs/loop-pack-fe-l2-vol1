import { ADDRESSES, CART, MEMBER } from './data';
import type { CheckoutState } from './types';

const SHIPPING_FEE = 3000;
const FREE_SHIPPING_THRESHOLD = 50000;
const REMOTE_AREA_SURCHARGE = 3000;
const VIP_DISCOUNT_RATE = 0.1;

type OrderAmountInput = Pick<
  CheckoutState,
  'addressId' | 'appliedCoupon' | 'usePoint' | 'pointInput'
>;

export function getOrderAmount(order: OrderAmountInput) {
  const address =
    ADDRESSES.find((a) => a.id === order.addressId) ?? ADDRESSES[0];

  // ── 배송비 정책 ──────────────────────────────
  const itemTotal = CART.reduce((sum, it) => sum + it.price * it.quantity, 0);
  let shippingFee = SHIPPING_FEE;
  if (itemTotal >= FREE_SHIPPING_THRESHOLD) shippingFee = 0;
  if (address.isRemote) shippingFee += REMOTE_AREA_SURCHARGE;

  // ── 쿠폰 / 적립금 정책 ───────────────────────
  const couponDiscount = order.appliedCoupon ? order.appliedCoupon.discount : 0;
  const pointDiscount = order.usePoint
    ? Math.min(order.pointInput, MEMBER.point, itemTotal)
    : 0;

  // ── 등급 할인 (쿠폰·배송비와 독립, 상품가에만) ─
  const vipDiscount =
    MEMBER.grade === 'VIP' ? Math.round(itemTotal * VIP_DISCOUNT_RATE) : 0;

  // ── 최종 금액 ────────────────────────────────
  const finalPrice =
    itemTotal + shippingFee - couponDiscount - pointDiscount - vipDiscount;

  return { itemTotal, shippingFee, couponDiscount, pointDiscount, finalPrice };
}

export type OrderAmount = ReturnType<typeof getOrderAmount>;
