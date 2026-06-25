/**
 * 주문 가격 계산 헬퍼
 * - 순수 함수로만 구성되어 React 의존성 없음
 * - 단위 테스트: calculateOrderPrice.test.ts
 */
import type { CartItem } from './types'

const BASE_SHIPPING_FEE = 3000
const FREE_SHIPPING_THRESHOLD = 50000
const REMOTE_SURCHARGE = 3000
const VIP_DISCOUNT_RATE = 0.9

/** 장바구니 상품 합계 금액 */
export const calculateItemTotal = (cartItems: CartItem[]) =>
  cartItems.reduce((sum, it) => sum + it.price * it.quantity, 0)

/** 배송비: 5만원 이상 무료, 도서산간 3,000원 추가 */
export const calculateShippingFee = (itemTotal: number, isRemote: boolean) => {
  const base = itemTotal >= FREE_SHIPPING_THRESHOLD ? 0 : BASE_SHIPPING_FEE
  return isRemote ? base + REMOTE_SURCHARGE : base
}

/** 적립금 할인: 입력값·보유 적립금·상품 금액 중 최솟값 적용 */
export const calculatePointDiscount = (
  pointInput: number,
  memberPoint: number,
  itemTotal: number,
) => Math.min(pointInput, memberPoint, itemTotal)

/** 최종 금액: VIP 등급이면 10% 할인 */
export const calculateFinalPrice = (subtotal: number, memberGrade: 'VIP' | 'NORMAL') =>
  memberGrade === 'VIP' ? Math.round(subtotal * VIP_DISCOUNT_RATE) : subtotal
