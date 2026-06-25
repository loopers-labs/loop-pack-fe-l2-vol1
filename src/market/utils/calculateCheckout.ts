import type { CartItem, Address, Coupon, Member } from '../types/types';

export const calculateCheckout = (
  cart: CartItem[],
  address: Address,
  appliedCoupon: Coupon | null,
  usePoint: boolean,
  pointInput: number,
  member: Member
) => {
  // ── 배송비 정책 ──────────────────────────────
  const itemTotal = cart.reduce((sum, it) => sum + it.price * it.quantity, 0);
  let shippingFee = 3000;
  if (itemTotal >= 50000) shippingFee = 0;
  if (address.isRemote) shippingFee += 3000;

  // ── 쿠폰 정책 ────────────────────────────────
  const couponDiscount = appliedCoupon ? appliedCoupon.discount : 0;

  // ── 적립금 정책 ──────────────────────────────
  const pointDiscount = usePoint ? Math.min(pointInput, member.point, itemTotal) : 0;

  // 최종 금액은 직접 계산한다.
  // 가격 계산 로직 -> 커스텀 훅으로 빼면 좋을듯?
  const finalPrice = itemTotal + shippingFee - couponDiscount - pointDiscount;

  return { itemTotal, shippingFee, couponDiscount, pointDiscount, finalPrice };
};
