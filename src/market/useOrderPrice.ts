/**
 * 주문 가격 계산 컨트롤러
 * - calculateOrderPrice의 순수 함수들을 조합하여 최종 가격 정보를 반환
 * - 컴포넌트에서는 이 훅만 호출하면 모든 가격 파생값을 받을 수 있음
 */
import type { CartItem } from './types'
import {
  calculateItemTotal,
  calculateShippingFee,
  calculatePointDiscount,
  calculateVipDiscountAmount,
} from './calculateOrderPrice'

type UseOrderPriceParams = {
  cartItems: CartItem[]
  isRemote: boolean
  couponDiscount: number
  usePoint: boolean
  pointInput: number
  memberPoint: number
  memberGrade: 'VIP' | 'NORMAL'
}

export const useOrderPrice = ({
  cartItems,
  isRemote,
  couponDiscount,
  usePoint,
  pointInput,
  memberPoint,
  memberGrade,
}: UseOrderPriceParams) => {
  // 제품 합계 금액 계산
  const itemTotal = calculateItemTotal(cartItems)
  // VIP 할인 금액 계산
  const vipDiscount = calculateVipDiscountAmount(itemTotal, memberGrade)
  // VIP 할인 적용 후 상품 합계 금액
  const itemTotalAfterVip = itemTotal - vipDiscount

  // 배송비 계산
  const shippingFee = calculateShippingFee(itemTotal, isRemote)
  // 적립금 할인 계산
  const pointDiscount = usePoint ? calculatePointDiscount(pointInput, memberPoint, itemTotal) : 0

  // 최종 할인 금액 계산
  const totalDiscount = couponDiscount + pointDiscount
  // 최종 결제 금액 계산
  const finalPrice = itemTotalAfterVip + shippingFee - totalDiscount

  return {
    itemTotal,
    shippingFee,
    couponDiscount,
    pointDiscount,
    vipDiscount,
    finalPrice,
  }
}
