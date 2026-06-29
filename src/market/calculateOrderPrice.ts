import type { Address, CartItem, Coupon, Member } from './types';

type OrderPriceInput = {
  cart: CartItem[];
  address: Address;
  coupon: Coupon | null;
  usePoint: boolean;
  pointInput: number;
  member: Member;
};

export type OrderPrice = {
  itemTotal: number;
  shippingFee: number;
  couponDiscount: number;
  pointDiscount: number;
  finalPrice: number;
};

// 주문 금액 계산 정책 (UI와 분리된 순수 함수).
export function calculateOrderPrice({
  cart,
  address,
  coupon,
  usePoint,
  pointInput,
  member,
}: OrderPriceInput): OrderPrice {
  const itemTotal = cart.reduce((sum, it) => sum + it.price * it.quantity, 0);

  // 배송비: 5만원 이상 무료, 도서산간 +3000
  let shippingFee = 3000;
  if (itemTotal >= 50000) shippingFee = 0;
  if (address.isRemote) shippingFee += 3000;

  const couponDiscount = coupon ? coupon.discount : 0;

  // 적립금: 입력값 · 보유량 · 상품금액 중 최소
  const pointDiscount = usePoint
    ? Math.min(pointInput, member.point, itemTotal)
    : 0;

  // VIP는 위 모든 할인 후 금액에서 추가 10%
  const priceBeforeVip =
    itemTotal + shippingFee - couponDiscount - pointDiscount;
  const finalPrice =
    member.grade === 'VIP' ? Math.round(priceBeforeVip * 0.9) : priceBeforeVip;

  return { itemTotal, shippingFee, couponDiscount, pointDiscount, finalPrice };
}
