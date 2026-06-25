import assert from 'node:assert/strict'
import { ADDRESSES, CART, COUPONS, MEMBER } from '../src/market/data.ts'
import {
  createCheckoutSummary,
  createPaymentOrderLines,
  createProductOrderLines,
} from '../src/market/checkoutModel.ts'

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
assert.equal(baseSummary.memberDiscount, 6500)
assert.equal(baseSummary.finalPrice, 58500)
assert.deepEqual(createProductOrderLines(CART)[0], {
  kind: 'product',
  id: 'p1',
  label: '무지 코튼 반팔티',
  amount: 38000,
  thumbnail: '👕',
  option: '차콜 / M',
  quantity: 2,
})

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
assert.equal(discountedRemoteSummary.memberDiscount, 6000)
assert.equal(discountedRemoteSummary.pointDiscount, MEMBER.point)
assert.equal(discountedRemoteSummary.finalPrice, 52800)
assert.deepEqual(
  createPaymentOrderLines({
    summary: discountedRemoteSummary,
    appliedCoupon: COUPONS[0],
    usePoint: true,
  }),
  [
    { kind: 'subtotal', label: '상품 금액', amount: 65000 },
    { kind: 'shipping', label: '배송비', amount: 3000 },
    {
      kind: 'coupon',
      label: '쿠폰 할인',
      amount: 5000,
      couponCode: 'WELCOME5000',
    },
    { kind: 'memberDiscount', label: '회원 할인', amount: 6000 },
    { kind: 'point', label: '적립금 사용', amount: 4200 },
  ],
)

const overDiscountedSummary = createCheckoutSummary({
  cart: CART,
  address: ADDRESSES[0],
  member: MEMBER,
  appliedCoupon: {
    code: 'TOO_BIG',
    label: '과한 쿠폰',
    discount: 999999,
  },
  usePoint: true,
  pointInput: 999999,
})

assert.equal(overDiscountedSummary.couponDiscount, 65000)
assert.equal(overDiscountedSummary.memberDiscount, 0)
assert.equal(overDiscountedSummary.pointDiscount, 0)
assert.equal(overDiscountedSummary.finalPrice, 0)
