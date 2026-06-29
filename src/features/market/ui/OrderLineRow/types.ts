import type { CartItem, Coupon, PastOrder } from '@/entities/market'

export type CartItemOrderLineProps = {
  cartItem: CartItem
}

export type CheckoutAmountOrderLineProps = {
  label: string
  amount: number
}

export type CouponDiscountOrderLineProps = {
  coupon: Coupon
  amount: number
}

export type PointDiscountOrderLineProps = {
  amount: number
}

export type MemberDiscountOrderLineProps = {
  amount: number
}

export type PastOrderLineProps = {
  pastOrder: PastOrder
}

export type OrderLineRowProps =
  | ({ kind: 'cart-item' } & CartItemOrderLineProps)
  | ({ kind: 'amount' } & CheckoutAmountOrderLineProps)
  | ({ kind: 'coupon-discount' } & CouponDiscountOrderLineProps)
  | ({ kind: 'point-discount' } & PointDiscountOrderLineProps)
  | ({ kind: 'member-discount' } & MemberDiscountOrderLineProps)
  | ({ kind: 'past-order' } & PastOrderLineProps)
