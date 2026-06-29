// Generated with Claude Code
import { createContext, useContext } from 'react'
import type { Address, CartItem, Coupon, Member } from '../types'

// 여러 컴포넌트(입력 + 요약)가 공유하는 결제 상태의 타입/컨텍스트/훅.
// 컴포넌트가 아닌 것들만 모아 fast-refresh 규칙을 만족시킨다.
export interface OrderSummary {
  itemTotal: number
  shippingFee: number
  couponDiscount: number
  pointDiscount: number
  finalPrice: number
}

export interface CheckoutContextValue {
  // 도메인 데이터
  cart: CartItem[]
  addresses: Address[]
  coupons: Coupon[]
  member: Member
  // 선택 상태 (여러 컴포넌트가 공유)
  selectedAddressId: string
  setSelectedAddressId: (id: string) => void
  appliedCoupon: Coupon | null
  setAppliedCoupon: React.Dispatch<React.SetStateAction<Coupon | null>>
  usePoint: boolean
  setUsePoint: React.Dispatch<React.SetStateAction<boolean>>
  pointInput: number
  setPointInput: React.Dispatch<React.SetStateAction<number>>
  // 파생 값 (state 가 아니라 매 렌더 계산 결과)
  selectedAddress: Address
  summary: OrderSummary
}

export const CheckoutContext = createContext<CheckoutContextValue | null>(null)

export function useCheckout() {
  const ctx = useContext(CheckoutContext)
  if (!ctx) throw new Error('useCheckout 는 CheckoutProvider 안에서만 사용할 수 있어요')
  return ctx
}
