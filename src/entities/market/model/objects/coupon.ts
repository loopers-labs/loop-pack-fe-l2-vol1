import type { CouponData } from '../types'

export class Coupon {
  readonly code: string
  readonly label: string
  readonly discount: number

  constructor(data: CouponData) {
    this.code = data.code
    this.label = data.label
    this.discount = data.discount
  }
}
