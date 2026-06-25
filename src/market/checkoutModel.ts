import type { Address, CartItem, Coupon, Member } from './types'

export type CheckoutSummaryInput = {
  cart: CartItem[]
  address: Address
  member: Member
  appliedCoupon: Coupon | null
  usePoint: boolean
  pointInput: number
}

export type CheckoutSummary = {
  itemTotal: number
  shippingFee: number
  couponDiscount: number
  pointDiscount: number
  finalPrice: number
}

export function createCheckoutSummary({
  cart,
  address,
  member,
  appliedCoupon,
  usePoint,
  pointInput,
}: CheckoutSummaryInput): CheckoutSummary {
  const itemTotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  )
  const baseShippingFee = itemTotal >= 50000 ? 0 : 3000
  const shippingFee = address.isRemote
    ? baseShippingFee + 3000
    : baseShippingFee
  const couponDiscount = appliedCoupon?.discount ?? 0
  const pointDiscount = usePoint
    ? Math.min(pointInput, member.point, itemTotal)
    : 0

  return {
    itemTotal,
    shippingFee,
    couponDiscount,
    pointDiscount,
    finalPrice: itemTotal + shippingFee - couponDiscount - pointDiscount,
  }
}
