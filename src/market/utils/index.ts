import type { CartItem, Coupon, Grade, Member, PaymentAmounts } from '../shared/types/types';

// 배송비 관련 상수들
const BASE_SHIPPING_FEE = 3000;
const FREE_SHIPPING_THRESHOLD = 50000;
const REMOTE_AREA_SURCHARGE = 3000;

const DISCOUNT_RATE: Record<Grade, number> = {
  // 일반 사용자의 할인율도 변경될 여지가 있으므로 같이 정의
  NORMAL: 0,
  VIP: 0.1,
};

export const calculateTotal = (cart: CartItem[]) => {
  return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
};

export const calulateCouponDiscount = (appliedCoupon: Coupon | null) => {
  return appliedCoupon ? appliedCoupon.discount : 0;
};

// 배송비 관련 금액들을 상수로 지정
export const calculateShippingFee = (itemTotal: number, isRemote: boolean): number => {
  let shippingFee = BASE_SHIPPING_FEE;
  if (itemTotal >= FREE_SHIPPING_THRESHOLD) shippingFee = 0;
  if (isRemote) shippingFee += REMOTE_AREA_SURCHARGE;
  return shippingFee;
};

export const calculateMemberDiscount = (itemTotal: number, member: Member) => {
  return itemTotal * DISCOUNT_RATE[member.grade];
};

export const calculatePointDiscount = (
  pointInput: number,
  memberPoint: number,
  itemTotal: number
) => {
  return Math.min(pointInput, memberPoint, itemTotal);
};

export const calculateFinalPrice = (amount: PaymentAmounts) => {
  const { itemTotal, shippingFee, couponDiscount, pointDiscount, memberDiscount } = amount;

  return itemTotal + shippingFee - couponDiscount - pointDiscount - memberDiscount;
};
