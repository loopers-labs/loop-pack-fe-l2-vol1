import { describe, expect, it } from 'vitest'
import {
  categoryIds,
  isCategoryId,
  isProductSort,
  sortValues,
} from './productListContract'

describe('상품 카탈로그 어휘', () => {
  it('지원하는 카테고리를 판별한다', () => {
    expect(categoryIds).toContain('digital')
    expect(isCategoryId('digital')).toBe(true)
    expect(isCategoryId('all')).toBe(false)
  })

  it('지원하는 정렬을 판별한다', () => {
    expect(sortValues).toContain('price-asc')
    expect(isProductSort('price-asc')).toBe(true)
    expect(isProductSort('cheapest')).toBe(false)
  })
})
