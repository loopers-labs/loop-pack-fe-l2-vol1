import type { Address, CartItem, Coupon, Member } from './types';

type Params = {
  cart: CartItem[];
  address: Address | undefined;
  appliedCoupon: Coupon | null;
  isUsingPoint: boolean;
  pointInput: number;
  member: Member;
};

// 결제 금액 계산 로직을 page에서 분리해 순수 함수로 모음
export function calculateCheckoutPrice({
  cart,
  address,
  appliedCoupon,
  isUsingPoint,
  pointInput,
  member,
}: Params) {
  const itemTotal = cart.reduce((sum, it) => sum + it.price * it.quantity, 0);

  let shippingFee = 3000;
  if (itemTotal >= 50000) shippingFee = 0;
  if (address?.isRemote) shippingFee += 3000;

  const couponDiscount = appliedCoupon ? appliedCoupon.discount : 0;
  const pointDiscount = isUsingPoint
    ? Math.min(pointInput, member.point, itemTotal)
    : 0;

  const base = itemTotal + shippingFee - couponDiscount - pointDiscount;
  const finalPrice = member.grade === 'VIP' ? Math.round(base * 0.9) : base;

  return { itemTotal, shippingFee, couponDiscount, pointDiscount, finalPrice };
}
