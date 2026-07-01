import type { Address, CartItem, Coupon, Member } from './types'

// ── 주문 금액 라인 union ──────────────────────────────────────────────────

export type ProductOrderLine = {
  kind: 'product'
  id: string
  label: string
  amount: number
  thumbnail: string
  option: string
  quantity: number
}

export type SubtotalOrderLine = {
  kind: 'subtotal'
  label: string
  amount: number
}
export type ShippingOrderLine = {
  kind: 'shipping'
  label: string
  amount: number
}
export type CouponOrderLine = {
  kind: 'coupon'
  label: string
  amount: number
  couponCode: string
}
export type PointOrderLine = { kind: 'point'; label: string; amount: number }

export type PaymentOrderLine =
  | SubtotalOrderLine
  | ShippingOrderLine
  | CouponOrderLine
  | PointOrderLine

export type OrderLine = ProductOrderLine | PaymentOrderLine

// ── 결제 요약 모델 ────────────────────────────────────────────────────────

export type CheckoutSummary = {
  itemTotal: number
  shippingFee: number
  couponDiscount: number
  pointDiscount: number
  finalPrice: number
  payableAmount: number
}

export function createCheckoutSummary({
  cart,
  address,
  member,
  appliedCoupon,
  usePoint,
  pointInput,
}: {
  cart: CartItem[]
  address: Address
  member: Member
  appliedCoupon: Coupon | null
  usePoint: boolean
  pointInput: number
}): CheckoutSummary {
  const itemTotal = cart.reduce((sum, it) => sum + it.price * it.quantity, 0)
  const baseShipping = itemTotal >= 50000 ? 0 : 3000
  const shippingFee = address.isRemote ? baseShipping + 3000 : baseShipping
  const couponDiscount = appliedCoupon?.discount ?? 0
  const pointDiscount = usePoint
    ? Math.min(pointInput, member.point, itemTotal)
    : 0
  const finalPrice = itemTotal + shippingFee - couponDiscount - pointDiscount
  const payableAmount =
    member.grade === 'VIP' ? Math.round(finalPrice * 0.9) : finalPrice
  return {
    itemTotal,
    shippingFee,
    couponDiscount,
    pointDiscount,
    finalPrice,
    payableAmount,
  }
}

export function createProductOrderLines(cart: CartItem[]): ProductOrderLine[] {
  return cart.map((it) => ({
    kind: 'product',
    id: it.id,
    label: it.name,
    amount: it.price * it.quantity,
    thumbnail: it.thumbnail,
    option: it.option,
    quantity: it.quantity,
  }))
}

export function createPaymentOrderLines({
  summary,
  appliedCoupon,
  usePoint,
}: {
  summary: CheckoutSummary
  appliedCoupon: Coupon | null
  usePoint: boolean
}): PaymentOrderLine[] {
  const lines: PaymentOrderLine[] = [
    { kind: 'subtotal', label: '상품 금액', amount: summary.itemTotal },
    { kind: 'shipping', label: '배송비', amount: summary.shippingFee },
  ]
  if (appliedCoupon) {
    lines.push({
      kind: 'coupon',
      label: '쿠폰 할인',
      amount: summary.couponDiscount,
      couponCode: appliedCoupon.code,
    })
  }
  if (usePoint) {
    lines.push({
      kind: 'point',
      label: '적립금 사용',
      amount: summary.pointDiscount,
    })
  }
  return lines
}
