import type { CouponDto } from '../types'

export class Coupon {
  readonly code: string
  readonly label: string
  readonly discount: number

  constructor(couponDto: CouponDto) {
    this.code = couponDto.code
    this.label = couponDto.label
    this.discount = couponDto.discount
  }
}
