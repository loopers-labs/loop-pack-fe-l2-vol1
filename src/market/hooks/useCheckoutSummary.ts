import { useState } from 'react';
import type { CartItem } from '@/market/types/cart.types';
import type { Member } from '@/market/types/member.types';
import {
  VIP_DISCOUNT_RATE,
  BASE_SHIPPING_FEE,
  FREE_SHIPPING_THRESHOLD,
  REMOTE_AREA_SURCHARGE,
} from '@/market/pricePolicy.ts';

export function useCheckout(cart: CartItem[], member: Member, isRemoteAddress: boolean) {
  const [couponDiscount, setCouponDiscount] = useState<number>(0);
  const [pointDiscount, setPointDiscount] = useState<number>(0);

  //총 상품 금액
  const itemTotal = cart.reduce((sum, it) => sum + it.price * it.quantity, 0);

  //배송비 정책
  let shippingFee = BASE_SHIPPING_FEE;
  if (itemTotal >= FREE_SHIPPING_THRESHOLD) shippingFee = 0;
  if (isRemoteAddress) shippingFee += REMOTE_AREA_SURCHARGE;

  //등급 할인
  const gradeDiscountItemTotal =
    member.grade === 'VIP' ? Math.round(itemTotal * VIP_DISCOUNT_RATE) : itemTotal;
  const gradeDiscount = itemTotal - gradeDiscountItemTotal;

  // 배송비는 할인 대상 제외 — 상품금액 기준으로만 포인트 한도 계산
  const discountableAmount = Math.max(0, gradeDiscountItemTotal - couponDiscount);
  const effectivePointDiscount = Math.min(pointDiscount, discountableAmount);
  const finalPrice = gradeDiscountItemTotal + shippingFee - couponDiscount - effectivePointDiscount;

  return {
    itemTotal,
    shippingFee,
    gradeDiscount,
    gradeDiscountItemTotal,
    couponDiscount,
    pointDiscount: effectivePointDiscount,
    finalPrice,
    setCouponDiscount,
    setPointDiscount,
  };
}
