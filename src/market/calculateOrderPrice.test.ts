import { describe, expect, it } from 'vitest'
import {
  calculateItemTotal,
  calculateShippingFee,
  calculatePointDiscount,
  calculateVipDiscountAmount,
} from './calculateOrderPrice'
import type { CartItem } from './types'

const createCartItem = (overrides: Partial<CartItem> = {}): CartItem => ({
  id: '1',
  name: '상품',
  option: '옵션',
  price: 10000,
  quantity: 1,
  thumbnail: '',
  ...overrides,
})

describe('calculateItemTotal', () => {
  it('price * quantity 합계를 반환한다', () => {
    const items = [
      createCartItem({ price: 10000, quantity: 2 }),
      createCartItem({ id: '2', price: 5000, quantity: 3 }),
    ]

    expect(calculateItemTotal(items)).toBe(35000)
  })

  it('빈 장바구니는 0원', () => {
    expect(calculateItemTotal([])).toBe(0)
  })
})

describe('calculateShippingFee', () => {
  it('기본 배송비 3,000원', () => {
    expect(calculateShippingFee(10000, false)).toBe(3000)
  })

  it('5만원 이상이면 무료배송', () => {
    expect(calculateShippingFee(50000, false)).toBe(0)
  })

  it('49,999원이면 배송비 부과', () => {
    expect(calculateShippingFee(49999, false)).toBe(3000)
  })

  it('도서산간이면 3,000원 추가', () => {
    expect(calculateShippingFee(10000, true)).toBe(6000)
  })

  it('5만원 이상 + 도서산간이면 3,000원만 부과', () => {
    expect(calculateShippingFee(50000, true)).toBe(3000)
  })
})

describe('calculatePointDiscount', () => {
  it('입력값, 보유 적립금, 상품 금액 중 최솟값 적용', () => {
    expect(calculatePointDiscount(5000, 10000, 3000)).toBe(3000)
  })

  it('보유 적립금이 가장 적으면 보유 적립금만큼 적용', () => {
    expect(calculatePointDiscount(5000, 2000, 30000)).toBe(2000)
  })

  it('입력값이 가장 적으면 입력값만큼 적용', () => {
    expect(calculatePointDiscount(1000, 10000, 30000)).toBe(1000)
  })
})

describe('calculateVipDiscountAmount', () => {
  it('VIP는 상품 금액의 10%를 할인 금액으로 반환한다', () => {
    expect(calculateVipDiscountAmount(50000, 'VIP')).toBe(50000 - Math.round(50000 * 0.9))
  })

  it('NORMAL은 할인 금액이 0이다', () => {
    expect(calculateVipDiscountAmount(50000, 'NORMAL')).toBe(0)
  })
})
