import { describe, it, expect } from 'vitest'
import { ADDRESSES, CART, COUPONS, MEMBER } from './data'
import {
  createCheckoutSummary,
  createPaymentOrderLines,
  createProductOrderLines,
} from './checkoutModel'

describe('createCheckoutSummary', () => {
  it('기본 주문: 무료배송 기준 충족 + VIP 10% 할인', () => {
    const summary = createCheckoutSummary({
      cart: CART,
      address: ADDRESSES[0],
      member: MEMBER,
      appliedCoupon: null,
      usePoint: false,
      pointInput: 0,
    })

    expect(summary.itemTotal).toBe(65000)
    expect(summary.shippingFee).toBe(0)
    expect(summary.couponDiscount).toBe(0)
    expect(summary.memberDiscount).toBe(6500)
    expect(summary.finalPrice).toBe(58500)
  })

  it('도서산간 + 쿠폰 + 포인트 전액: 모든 할인이 함께 반영된다', () => {
    const remote = ADDRESSES.find((address) => address.isRemote)!

    const summary = createCheckoutSummary({
      cart: CART,
      address: remote,
      member: MEMBER,
      appliedCoupon: COUPONS[0],
      usePoint: true,
      pointInput: 999999,
    })

    expect(summary.shippingFee).toBe(3000)
    expect(summary.couponDiscount).toBe(5000)
    expect(summary.memberDiscount).toBe(6000)
    expect(summary.pointDiscount).toBe(MEMBER.point)
    expect(summary.finalPrice).toBe(52800)
  })

  it('과한 할인: 최종 금액이 0 밑으로 내려가지 않는다', () => {
    const summary = createCheckoutSummary({
      cart: CART,
      address: ADDRESSES[0],
      member: MEMBER,
      appliedCoupon: { code: 'TOO_BIG', label: '과한 쿠폰', discount: 999999 },
      usePoint: true,
      pointInput: 999999,
    })

    expect(summary.couponDiscount).toBe(65000)
    expect(summary.memberDiscount).toBe(0)
    expect(summary.pointDiscount).toBe(0)
    expect(summary.finalPrice).toBe(0)
  })
})

describe('createProductOrderLines', () => {
  it('카트 항목을 product 라인으로 변환한다', () => {
    expect(createProductOrderLines(CART)[0]).toEqual({
      kind: 'product',
      id: 'p1',
      label: '무지 코튼 반팔티',
      amount: 38000,
      thumbnail: '👕',
      option: '차콜 / M',
      quantity: 2,
    })
  })
})

describe('createPaymentOrderLines', () => {
  it('쿠폰·회원·포인트가 모두 적용되면 해당 라인이 순서대로 들어간다', () => {
    const remote = ADDRESSES.find((address) => address.isRemote)!
    const summary = createCheckoutSummary({
      cart: CART,
      address: remote,
      member: MEMBER,
      appliedCoupon: COUPONS[0],
      usePoint: true,
      pointInput: 999999,
    })

    expect(
      createPaymentOrderLines({
        summary,
        appliedCoupon: COUPONS[0],
        usePoint: true,
      }),
    ).toEqual([
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
    ])
  })

  it('쿠폰·포인트가 없으면 상품 금액과 배송비 라인만 남는다', () => {
    const summary = createCheckoutSummary({
      cart: CART,
      address: ADDRESSES[0],
      member: MEMBER,
      appliedCoupon: null,
      usePoint: false,
      pointInput: 0,
    })

    expect(
      createPaymentOrderLines({
        summary,
        appliedCoupon: null,
        usePoint: false,
      }).map((line) => line.kind),
    ).toEqual(['subtotal', 'shipping', 'memberDiscount'])
  })
})
