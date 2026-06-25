import assert from 'node:assert/strict'
import { ADDRESSES, CART, COUPONS, MEMBER } from '../src/market/data.ts'
import { createCheckoutSummary } from '../src/market/checkoutModel.ts'

const remoteAddress = ADDRESSES.find((address) => address.isRemote)

assert.ok(remoteAddress)

const baseSummary = createCheckoutSummary({
  cart: CART,
  address: ADDRESSES[0],
  member: MEMBER,
  appliedCoupon: null,
  usePoint: false,
  pointInput: 0,
})

assert.equal(baseSummary.itemTotal, 65000)
assert.equal(baseSummary.shippingFee, 0)
assert.equal(baseSummary.finalPrice, 65000)

const discountedRemoteSummary = createCheckoutSummary({
  cart: CART,
  address: remoteAddress,
  member: MEMBER,
  appliedCoupon: COUPONS[0],
  usePoint: true,
  pointInput: 999999,
})

assert.equal(discountedRemoteSummary.shippingFee, 3000)
assert.equal(discountedRemoteSummary.couponDiscount, 5000)
assert.equal(discountedRemoteSummary.pointDiscount, MEMBER.point)
assert.equal(discountedRemoteSummary.finalPrice, 58800)
