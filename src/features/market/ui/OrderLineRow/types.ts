import type { CartItem, Coupon } from '@/entities/market'

export type CartItemOrderLineProps = {
  item: CartItem
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

export type OrderLineRowProps =
  | ({ kind: 'cart-item' } & CartItemOrderLineProps)
  | ({ kind: 'amount' } & CheckoutAmountOrderLineProps)
  | ({ kind: 'coupon-discount' } & CouponDiscountOrderLineProps)
  | ({ kind: 'point-discount' } & PointDiscountOrderLineProps)
