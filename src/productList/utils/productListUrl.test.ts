import { describe, expect, it } from 'vitest'
import {
  buildProductListSearchParams,
  readProductListSearchParams,
} from './productListUrl'

describe('productListUrl', () => {
  it('reads filter and page state from URL search params', () => {
    const state = readProductListSearchParams(
      new URLSearchParams(
        'category=fashion&q=coat&page=3&sort=price-desc&minPrice=10000&maxPrice=50000&inStock=true',
      ),
    )

    expect(state).toEqual({
      filters: {
        category: 'fashion',
        searchQuery: 'coat',
        sortBy: 'price-desc',
        minPrice: 10000,
        maxPrice: 50000,
        inStockOnly: true,
      },
      page: 3,
    })
  })

  it('falls back to defaults for invalid URL search params', () => {
    const state = readProductListSearchParams(
      new URLSearchParams(
        'category=wrong&page=-1&sort=wrong&minPrice=abc&maxPrice=NaN',
      ),
    )

    expect(state).toEqual({
      filters: {
        category: 'all',
        searchQuery: '',
        sortBy: 'latest',
        minPrice: '',
        maxPrice: '',
        inStockOnly: false,
      },
      page: 1,
    })
  })

  it('writes only non-default state to URL search params', () => {
    const params = buildProductListSearchParams({
      filters: {
        category: 'beauty',
        searchQuery: 'serum',
        sortBy: 'popular',
        minPrice: 30000,
        maxPrice: '',
        inStockOnly: true,
      },
      page: 2,
    })

    expect(params.toString()).toBe(
      'category=beauty&q=serum&page=2&sort=popular&minPrice=30000&inStock=true',
    )
  })
})
