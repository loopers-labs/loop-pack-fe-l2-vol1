import type { Address, CartItem, Coupon, Member } from '../objects'

const BASE_SHIPPING_FEE = 3000
const FREE_SHIPPING_THRESHOLD = 50000
const REMOTE_AREA_EXTRA_SHIPPING_FEE = 3000
const VIP_DISPLAY_DISCOUNT_RATE = 0.1

export class MarketPricingPolicy {
  static calculateItemTotal(cartItems: ReadonlyArray<CartItem>) {
    return cartItems.reduce((sum, item) => sum + item.totalPrice, 0)
  }

  static calculateShippingFee(itemTotal: number, address: Address) {
    const baseShippingFee =
      itemTotal >= FREE_SHIPPING_THRESHOLD ? 0 : BASE_SHIPPING_FEE

    if (address.isRemote) {
      return baseShippingFee + REMOTE_AREA_EXTRA_SHIPPING_FEE
    }

    return baseShippingFee
  }

  static calculateCouponDiscount(coupon: Coupon | null) {
    return coupon?.discount ?? 0
  }

  static calculatePointDiscount({
    enabled,
    pointInput,
    member,
    itemTotal,
  }: {
    enabled: boolean
    pointInput: number
    member: Member
    itemTotal: number
  }) {
    if (!enabled) {
      return 0
    }

    return Math.min(pointInput, member.point, itemTotal)
  }

  static calculateFinalPrice({
    itemTotal,
    shippingFee,
    couponDiscount,
    pointDiscount,
  }: {
    itemTotal: number
    shippingFee: number
    couponDiscount: number
    pointDiscount: number
  }) {
    return itemTotal + shippingFee - couponDiscount - pointDiscount
  }

  static calculateMemberDisplayPrice(amount: number, member?: Member) {
    if (member?.grade !== 'VIP') {
      return amount
    }

    return Math.round(amount * (1 - VIP_DISPLAY_DISCOUNT_RATE))
  }
}
