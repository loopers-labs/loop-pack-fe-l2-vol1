import { describe, expect, it } from 'vitest'
import {
  formatPrice,
  getDiscountRate,
  isAlmostSoldOut,
  isBestSeller,
  isFreeShipping,
  isHotDeal,
  isNewProduct,
  isSoldOut,
} from './utils/productRules'

describe('productRules', () => {
  it('formats a product price with Korean won suffix', () => {
    expect(formatPrice(289000)).toBe('289,000원')
  })

  it('calculates a rounded discount rate only when original price exists', () => {
    expect(getDiscountRate({ price: 289000, originalPrice: 389000 })).toBe(26)
    expect(getDiscountRate({ price: 165000 })).toBe(0)
  })

  it('classifies product sales badges from stock, discount, rating, and price', () => {
    expect(isSoldOut({ stock: 0 })).toBe(true)
    expect(isAlmostSoldOut({ stock: 5 })).toBe(true)
    expect(isAlmostSoldOut({ stock: 0 })).toBe(false)
    expect(isHotDeal({ discountRate: 30 })).toBe(true)
    expect(isBestSeller({ rating: 4.5, reviewCount: 100 })).toBe(true)
    expect(isFreeShipping({ price: 50000 })).toBe(true)
  })

  it('treats products created within seven days as new', () => {
    const now = new Date('2026-06-30T00:00:00.000Z')

    expect(
      isNewProduct({
        createdAt: '2026-06-23T00:00:00.000Z',
        now,
      }),
    ).toBe(true)
    expect(
      isNewProduct({
        createdAt: '2026-06-22T00:00:00.000Z',
        now,
      }),
    ).toBe(false)
  })
})
