import type { Address, CartItem, Coupon, Member } from './types';

// AI 생성 코드
type PricingInput = {
  cart: CartItem[];
  // 선택된 주소가 없을 수 있음 — 없으면 도서산간 배송비 없이 계산
  address?: Address;
  coupon: Coupon | null;
  pointInput: number;
  member: Member;
};

export type PricingResult = {
  itemTotal: number;
  shippingFee: number;
  couponDiscount: number;
  pointDiscount: number;
  vipDiscount: number;
  finalPrice: number;
};

export function calcFinalPrice(input: PricingInput): PricingResult {
  const itemTotal = input.cart.reduce((sum, it) => sum + it.price * it.quantity, 0);

  let shippingFee = 3000;
  if (itemTotal >= 50000) shippingFee = 0;
  if (input.address?.isRemote) shippingFee += 3000;

  const couponDiscount = input.coupon ? input.coupon.discount : 0;
  const pointDiscount = Math.min(input.pointInput, input.member.point, itemTotal);

  // 각 할인은 정가 기준 독립 차감 — VIP 10%는 상품 금액에만, 배송비는 정가
  const vipDiscount = input.member.grade === 'VIP' ? Math.round(itemTotal * 0.1) : 0;
  const finalPrice = itemTotal - vipDiscount - couponDiscount - pointDiscount + shippingFee;

  return { itemTotal, shippingFee, couponDiscount, pointDiscount, vipDiscount, finalPrice };
}
