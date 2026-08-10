import { describe, expect, it } from 'vitest'

import { ProductListRequestModel } from './ProductListRequest'
import { ProductQueryKeyFactory } from './ProductQueryKeyFactory'

describe('ProductQueryKeyFactory', () => {
  it('creates canonical home and product list keys', () => {
    const request = ProductListRequestModel.normalize({ scenario: 'slow' })

    expect(ProductQueryKeyFactory.home({ scenario: 'empty' })).toEqual([
      'home',
      { scenario: 'empty' },
    ])
    expect(ProductQueryKeyFactory.productList(request)).toEqual([
      'products',
      'list',
      request,
    ])
  })
})
