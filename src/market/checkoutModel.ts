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

export type DiscountOrderLine = CouponDiscountOrderLine | PointDiscountOrderLine

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

  if (usePoint) {
    lines.push({
      kind: 'point',
      label: '적립금 사용',
      amount: summary.pointDiscount,
    })
  }

  return lines
}
