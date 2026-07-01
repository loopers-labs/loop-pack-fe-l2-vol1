import type { Address, CartItem, Coupon, Member } from './types';

type Params = {
  cart: CartItem[];
  address: Address | undefined;
  appliedCoupon: Coupon | null;
  isUsingPoint: boolean;
  pointInput: number;
  member: Member;
};

function calcItemTotal(cart: CartItem[]) {
  return cart.reduce((sum, it) => sum + it.price * it.quantity, 0);
}

function calcShippingFee(itemTotal: number, address: Address | undefined) {
  let fee = itemTotal >= 50000 ? 0 : 3000;
  if (address?.isRemote) fee += 3000;
  return fee;
}

function calcVipDiscount(itemTotal: number, grade: Member['grade']) {
  return grade === 'VIP' ? Math.round(itemTotal * 0.1) : 0;
}

function calcPointDiscount(
  isUsingPoint: boolean,
  pointInput: number,
  memberPoint: number,
  itemTotal: number,
) {
  return isUsingPoint ? Math.min(pointInput, memberPoint, itemTotal) : 0;
}

export function calculateCheckoutPrice({
  cart,
  address,
  appliedCoupon,
  isUsingPoint,
  pointInput,
  member,
}: Params) {
  const itemTotal = calcItemTotal(cart);
  const shippingFee = calcShippingFee(itemTotal, address);
  const couponDiscount = appliedCoupon?.discount ?? 0;
  const vipDiscount = calcVipDiscount(itemTotal, member.grade);
  const pointDiscount = calcPointDiscount(
    isUsingPoint,
    pointInput,
    member.point,
    itemTotal,
  );

  const finalPrice =
    itemTotal + shippingFee - vipDiscount - couponDiscount - pointDiscount;

  return {
    itemTotal,
    shippingFee,
    couponDiscount,
    vipDiscount,
    pointDiscount,
    finalPrice,
  };
}
