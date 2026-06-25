import type { Address, CartItem, Coupon, Member } from './types';

type PricingInput = {
  cart: CartItem[];
  address: Address;
  coupon: Coupon | null;
  pointInput: number;
  member: Member;
};

export type PricingResult = {
  itemTotal: number;
  shippingFee: number;
  couponDiscount: number;
  pointDiscount: number;
  finalPrice: number;
};

export function getFinalPrice(input: PricingInput): PricingResult {
  const itemTotal = input.cart.reduce((sum, it) => sum + it.price * it.quantity, 0);

  let shippingFee = 3000;
  if (itemTotal >= 50000) shippingFee = 0;
  if (input.address.isRemote) shippingFee += 3000;

  const couponDiscount = input.coupon ? input.coupon.discount : 0;
  const pointDiscount = Math.min(input.pointInput, input.member.point, itemTotal);

  const subtotal = itemTotal + shippingFee - couponDiscount - pointDiscount;
  const finalPrice = input.member.grade === 'VIP' ? Math.round(subtotal * 0.9) : subtotal;

  return { itemTotal, shippingFee, couponDiscount, pointDiscount, finalPrice };
}
