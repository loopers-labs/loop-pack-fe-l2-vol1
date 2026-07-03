import type { Address, CartItem, Coupon, Member } from "./types";

// 등급 할인율 — VIP 는 최종 net 의 10%.
// (명세 부재로 이 과제에서 정한 정책: 쿠폰·적립금 적용 후 최종 단계에서 등급 할인)
const VIP_DISCOUNT_RATE = 0.1;

export type OrderAmount = {
  itemTotal: number;
  shippingFee: number;
  couponDiscount: number;
  pointDiscount: number;
  gradeDiscount: number;
  finalPrice: number;
};

type Params = {
  cart: CartItem[];
  address: Address;
  appliedCoupon: Coupon | null;
  usePoint: boolean;
  pointInput: number;
  member: Member;
};

// 체크아웃 금액 정책을 한곳에 모은다 — 배송비·쿠폰·적립금·등급 할인·최종 금액.
export function calculateOrderAmount({
  cart,
  address,
  appliedCoupon,
  usePoint,
  pointInput,
  member,
}: Params): OrderAmount {
  const itemTotal = cart.reduce((sum, it) => sum + it.price * it.quantity, 0);

  let shippingFee = 3000;
  if (itemTotal >= 50000) shippingFee = 0;
  if (address.isRemote) shippingFee += 3000;

  const couponDiscount = appliedCoupon ? appliedCoupon.discount : 0;
  const pointDiscount = usePoint
    ? Math.min(
        Math.max(Math.floor(pointInput) || 0, 0),
        member.point,
        Math.max(itemTotal + shippingFee - couponDiscount, 0),
      )
    : 0;

  // 쿠폰·적립금을 모두 적용한 net 에 등급 할인을 건다(최종 단계 할인).
  const net = Math.max(itemTotal + shippingFee - couponDiscount - pointDiscount, 0);
  const gradeDiscount = member.grade === "VIP" ? Math.round(net * VIP_DISCOUNT_RATE) : 0;
  const finalPrice = Math.max(net - gradeDiscount, 0);

  return { itemTotal, shippingFee, couponDiscount, pointDiscount, gradeDiscount, finalPrice };
}
