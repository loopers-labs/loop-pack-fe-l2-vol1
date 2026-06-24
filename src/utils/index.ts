import type { CartItem, Coupon, Member, PaymentAmounts } from "../market/types";

const FREE_SHIPPING_THRESHOLD = 50000;
const BASE_SHIPPING_FEE = 3000;
const REMOTE_SHIPPING_SURCHARGE = 3000;
const VIP_PRICE_MULTIPLIER = 0.9;

export function calculateItemTotal(cart: CartItem[]): number {
  return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function calculateShippingFee(
  itemTotal: number,
  isRemote: boolean,
): number {
  const baseFee = itemTotal >= FREE_SHIPPING_THRESHOLD ? 0 : BASE_SHIPPING_FEE;

  return isRemote ? baseFee + REMOTE_SHIPPING_SURCHARGE : baseFee;
}

export function calculateCouponDiscount(coupon: Coupon | null): number {
  return coupon ? coupon.discount : 0;
}

export function calculatePointDiscount(
  pointInput: number,
  memberPoint: number,
  itemTotal: number,
): number {
  return Math.min(pointInput, memberPoint, itemTotal);
}

export function calculateMemberPrice(amount: number, member?: Member): number {
  return member?.grade === "VIP"
    ? Math.round(amount * VIP_PRICE_MULTIPLIER)
    : amount;
}

export function calculateFinalPrice(
  amounts: PaymentAmounts,
  member?: Member,
): number {
  const { itemTotal, shippingFee, couponDiscount, pointDiscount } = amounts;
  const priceBeforeMembership =
    itemTotal + shippingFee - couponDiscount - pointDiscount;

  return calculateMemberPrice(priceBeforeMembership, member);
}
