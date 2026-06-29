import type { Address, CartItem, Coupon, Member } from '../objects'

const BASE_SHIPPING_FEE = 3000
const FREE_SHIPPING_THRESHOLD = 50000
const REMOTE_AREA_EXTRA_SHIPPING_FEE = 3000
const VIP_DISPLAY_DISCOUNT_RATE = 0.1

type CheckoutPriceQuoteParams = {
  cartItems: ReadonlyArray<CartItem>
  selectedAddress: Address
  appliedCoupon: Coupon | null
  pointsToUse: number
  member: Member
}

export class CheckoutPriceQuote {
  constructor(private readonly params: CheckoutPriceQuoteParams) {}

  get itemTotal() {
    return this.params.cartItems.reduce((sum, item) => sum + item.totalPrice, 0)
  }

  get shippingFee() {
    const baseShippingFee =
      this.itemTotal >= FREE_SHIPPING_THRESHOLD ? 0 : BASE_SHIPPING_FEE

    if (this.params.selectedAddress.isRemote) {
      return baseShippingFee + REMOTE_AREA_EXTRA_SHIPPING_FEE
    }

    return baseShippingFee
  }

  get couponDiscount() {
    return this.params.appliedCoupon?.discount ?? 0
  }

  get pointDiscount() {
    if (this.params.pointsToUse <= 0) {
      return 0
    }

    return Math.min(
      this.params.pointsToUse,
      this.params.member.point,
      this.itemTotal,
    )
  }

  get payableAmount() {
    return this.discountedSubtotal - this.memberDiscount
  }

  get memberDiscount() {
    if (this.params.member.grade !== 'VIP') {
      return 0
    }

    return Math.round(this.discountedSubtotal * VIP_DISPLAY_DISCOUNT_RATE)
  }

  private get discountedSubtotal() {
    return (
      this.itemTotal +
      this.shippingFee -
      this.couponDiscount -
      this.pointDiscount
    )
  }
}
