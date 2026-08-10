import { describe, expect, it } from 'vitest'

import { ProductListRouteParams } from './ProductListRouteParams'

describe('ProductListRouteParams', () => {
  it('uses first repeated record values and forces page size twelve', () => {
    const request = ProductListRouteParams.toRequest({
      q: ['stanley', 'ignored'],
      category: ['home', 'fashion'],
      sort: ['popular', 'latest'],
      page: ['2', '3'],
      pageSize: ['24', '6'],
      scenario: ['slow', 'error'],
    })

    expect(request).toEqual({
      q: 'stanley',
      category: 'home',
      sort: 'popular',
      page: 2,
      pageSize: 12,
      scenario: 'slow',
    })
  })

  it('matches URLSearchParams first-value semantics', () => {
    const searchParams = new URLSearchParams(
      'q=stanley&q=ignored&category=home&page=2&pageSize=24&scenario=empty',
    )

    expect(ProductListRouteParams.toRequest(searchParams)).toEqual(
      ProductListRouteParams.toRequest({
        q: ['stanley', 'ignored'],
        category: 'home',
        page: '2',
        pageSize: '24',
        scenario: 'empty',
      }),
    )
  })

  it('omits diagnostic and transport fields from canonical search', () => {
    const request = ProductListRouteParams.toRequest({
      q: 'stanley',
      category: 'home',
      sort: 'price-desc',
      page: '2',
      pageSize: '24',
      scenario: 'slow',
    })

    expect(
      ProductListRouteParams.canonicalSearchParams(request).toString(),
    ).toBe('q=stanley&category=home&sort=price-desc&page=2')
  })

  it('treats an empty repeated record value as missing', () => {
    expect(ProductListRouteParams.toRequest({ q: [], pageSize: '24' })).toEqual(
      {
        q: '',
        category: 'all',
        sort: 'latest',
        page: 1,
        pageSize: 12,
      },
    )
  })
})
