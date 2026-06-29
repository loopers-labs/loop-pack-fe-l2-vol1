// Generated with Claude Code
import { useMemo, useState } from 'react'
import type { Address, CartItem, Coupon, Member } from '../types'
import { CheckoutContext, type CheckoutContextValue, type OrderSummary } from './CheckoutContext'

interface CheckoutProviderProps {
  cart: CartItem[]
  addresses: Address[]
  coupons: Coupon[]
  member: Member
  children: React.ReactNode
}

// data로 계산된 값들이 전역적으로 사용되어 context를 사용
export function CheckoutProvider({
  cart,
  addresses,
  coupons,
  member,
  children,
}: CheckoutProviderProps) {
  const [selectedAddressId, setSelectedAddressId] = useState(addresses[0].id)
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null)
  const [usePoint, setUsePoint] = useState(false)
  const [pointInput, setPointInput] = useState(0)

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId) ?? addresses[0]

  // 모든 금액은 선택 상태로부터 파생 계산한다. finalPrice 를 state 로 두지 않는다.
  const summary = useMemo<OrderSummary>(() => {
    // ── 상품 금액 ──
    const itemTotal = cart.reduce((sum, it) => sum + it.price * it.quantity, 0)

    // ── 배송비 정책 ──
    let shippingFee = itemTotal >= 50000 ? 0 : 3000
    if (selectedAddress.isRemote) shippingFee += 3000

    // ── 쿠폰 / 적립금 정책 ──
    const couponDiscount = appliedCoupon ? appliedCoupon.discount : 0
    const pointDiscount = usePoint ? Math.min(pointInput, member.point, itemTotal) : 0

    // ── 최종 금액 ──
    const finalPrice = itemTotal + shippingFee - couponDiscount - pointDiscount

    return { itemTotal, shippingFee, couponDiscount, pointDiscount, finalPrice }
  }, [cart, selectedAddress, appliedCoupon, usePoint, pointInput, member.point])

  const value: CheckoutContextValue = {
    cart,
    addresses,
    coupons,
    member,
    selectedAddressId,
    setSelectedAddressId,
    appliedCoupon,
    setAppliedCoupon,
    usePoint,
    setUsePoint,
    pointInput,
    setPointInput,
    selectedAddress,
    summary,
  }

  return <CheckoutContext.Provider value={value}>{children}</CheckoutContext.Provider>
}
