import { describe, expect, it } from 'vitest'

import {
  categorySchema,
  parseCategory,
  parseSort,
  sortSchema,
} from '@/entities/product/model/ProductQuerySchema'

import { productFilterParsers, type ProductFilters } from './useProductFilters'
describe('productFilterParsers', () => {
  it('does not expose diagnostic scenario as a user filter', () => {
    expect(Object.keys(productFilterParsers)).not.toContain('scenario')
  })

  it('q default is empty string', () => {
    expect(productFilterParsers.q.defaultValue).toBe('')
  })

  it('category default is all', () => {
    expect(productFilterParsers.category.defaultValue).toBe('all')
  })

  it('sort default is latest (spec requirement)', () => {
    expect(productFilterParsers.sort.defaultValue).toBe('latest')
  })

  it('page default is 1', () => {
    expect(productFilterParsers.page.defaultValue).toBe(1)
  })

  describe('page parser contract', () => {
    it.each([1, 42])(
      'Given a valid positive integer %i When parsed Then it returns the same page',
      (page) => {
        expect(productFilterParsers.page.parse(String(page))).toBe(page)
      },
    )

    it.each(['0', '-1', '1.5', 'abc'])(
      'Given an invalid page value %s When parsed Then it falls back to page 1',
      (value) => {
        expect(productFilterParsers.page.parse(value)).toBe(1)
      },
    )
  })

  it('ProductFilters type covers q, category, sort, page', () => {
    const filters: ProductFilters = {
      q: '',
      category: 'all',
      sort: 'latest',
      page: 1,
    }
    expect(filters).toEqual({
      q: '',
      category: 'all',
      sort: 'latest',
      page: 1,
    })
  })
})

describe('parseCategory', () => {
  it('returns valid category as-is', () => {
    expect(parseCategory('fashion')).toBe('fashion')
    expect(parseCategory('digital')).toBe('digital')
  })

  it('falls back to all for invalid value', () => {
    expect(parseCategory('invalid')).toBe('all')
    expect(parseCategory('')).toBe('all')
  })

  it('categorySchema matches spec enum', () => {
    expect(categorySchema.options).toEqual([
      'all',
      'casual',
      'fashion',
      'goods',
      'home',
      'digital',
    ])
  })
})

describe('parseSort', () => {
  it('returns valid sort as-is', () => {
    expect(parseSort('latest')).toBe('latest')
    expect(parseSort('price-asc')).toBe('price-asc')
  })

  it('falls back to latest for invalid value', () => {
    expect(parseSort('invalid')).toBe('latest')
    expect(parseSort('')).toBe('latest')
  })

  it('sortSchema matches spec enum', () => {
    expect(sortSchema.options).toEqual([
      'latest',
      'popular',
      'price-asc',
      'price-desc',
    ])
  })
})
