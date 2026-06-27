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
  memberDiscount: number
  pointDiscount: number
  finalPrice: number
}

export type ProductOrderLine = {
  kind: 'product'
  id: string
  label: string
  amount: number
  thumbnail: string
  option: string
  quantity: number
}

export type BasicOrderLine = {
  kind: 'subtotal' | 'shipping'
  label: string
  amount: number
}

export type CouponDiscountOrderLine = {
  kind: 'coupon'
  label: string
  amount: number
  couponCode: string
}

export type PointDiscountOrderLine = {
  kind: 'point'
  label: string
  amount: number
}

export type MemberDiscountOrderLine = {
  kind: 'memberDiscount'
  label: string
  amount: number
}

export type DiscountOrderLine =
  | CouponDiscountOrderLine
  | PointDiscountOrderLine
  | MemberDiscountOrderLine

export type PaymentOrderLine = BasicOrderLine | DiscountOrderLine

export type OrderLine = ProductOrderLine | PaymentOrderLine

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
  const couponDiscount = Math.min(appliedCoupon?.discount ?? 0, itemTotal)
  // VIP 할인: 배송비는 제외하고 (상품금액 - 쿠폰할인)의 10%. 적용 순서는 쿠폰 → 회원 → 포인트.
  const memberDiscount =
    member.grade === 'VIP' ? Math.round((itemTotal - couponDiscount) * 0.1) : 0
  const payableBeforePoint = Math.max(
    0,
    itemTotal + shippingFee - couponDiscount - memberDiscount,
  )
  const pointDiscount = usePoint
    ? Math.min(Math.max(0, pointInput), member.point, payableBeforePoint)
    : 0

  return {
    itemTotal,
    shippingFee,
    couponDiscount,
    memberDiscount,
    pointDiscount,
    finalPrice: payableBeforePoint - pointDiscount,
  }
}

export function createProductOrderLines(cart: CartItem[]): ProductOrderLine[] {
  return cart.map((item) => ({
    kind: 'product',
    id: item.id,
    label: item.name,
    amount: item.price * item.quantity,
    thumbnail: item.thumbnail,
    option: item.option,
    quantity: item.quantity,
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
    {
      kind: 'subtotal',
      label: '상품 금액',
      amount: summary.itemTotal,
    },
    {
      kind: 'shipping',
      label: '배송비',
      amount: summary.shippingFee,
    },
  ]

  if (appliedCoupon) {
    lines.push({
      kind: 'coupon',
      label: '쿠폰 할인',
      amount: summary.couponDiscount,
      couponCode: appliedCoupon.code,
    })
  }

  if (summary.memberDiscount > 0) {
    lines.push({
      kind: 'memberDiscount',
      label: '회원 할인',
      amount: summary.memberDiscount,
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
