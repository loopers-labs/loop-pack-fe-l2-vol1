import { describe, expect, it } from 'vitest'

import type { ProductListQuery } from '@/entities/product/model/types'

import { ProductService } from './ProductService'

describe('ProductService.queryKeyFactory.home', () => {
  it('returns a stable home key', () => {
    expect(ProductService.queryKeyFactory.home.all()).toEqual(['home'])
  })
})

describe('ProductService.queryKeyFactory.product.list', () => {
  it('returns a key containing the full ProductListQuery', () => {
    const query: ProductListQuery = {
      q: 'stanley',
      category: 'fashion',
      sort: 'price-asc',
      page: 2,
      pageSize: 12,
    }
    expect(ProductService.queryKeyFactory.product.list(query)).toEqual([
      'products',
      'list',
      query,
    ])
  })

  it('reflects q changes in the key', () => {
    const base: ProductListQuery = {
      q: '',
      category: 'all',
      sort: 'latest',
      page: 1,
      pageSize: 12,
    }
    const a = ProductService.queryKeyFactory.product.list(base)
    const b = ProductService.queryKeyFactory.product.list({
      ...base,
      q: 'stanley',
    })
    expect(a).not.toEqual(b)
  })

  it('reflects category changes in the key', () => {
    const base: ProductListQuery = {
      q: '',
      category: 'all',
      sort: 'latest',
      page: 1,
      pageSize: 12,
    }
    const a = ProductService.queryKeyFactory.product.list(base)
    const b = ProductService.queryKeyFactory.product.list({
      ...base,
      category: 'fashion',
    })
    expect(a).not.toEqual(b)
  })

  it('reflects sort changes in the key', () => {
    const base: ProductListQuery = {
      q: '',
      category: 'all',
      sort: 'latest',
      page: 1,
      pageSize: 12,
    }
    const a = ProductService.queryKeyFactory.product.list(base)
    const b = ProductService.queryKeyFactory.product.list({
      ...base,
      sort: 'popular',
    })
    expect(a).not.toEqual(b)
  })

  it('reflects page changes in the key', () => {
    const base: ProductListQuery = {
      q: '',
      category: 'all',
      sort: 'latest',
      page: 1,
      pageSize: 12,
    }
    const a = ProductService.queryKeyFactory.product.list(base)
    const b = ProductService.queryKeyFactory.product.list({
      ...base,
      page: 2,
    })
    expect(a).not.toEqual(b)
  })

  it('reflects pageSize changes in the key', () => {
    const base: ProductListQuery = {
      q: '',
      category: 'all',
      sort: 'latest',
      page: 1,
      pageSize: 12,
    }
    const a = ProductService.queryKeyFactory.product.list(base)
    const b = ProductService.queryKeyFactory.product.list({
      ...base,
      pageSize: 24,
    })
    expect(a).not.toEqual(b)
  })

  it('produces equal keys for equal queries (cache hit)', () => {
    const query: ProductListQuery = {
      q: 'stanley',
      category: 'fashion',
      sort: 'price-asc',
      page: 2,
      pageSize: 12,
    }
    expect(ProductService.queryKeyFactory.product.list(query)).toEqual(
      ProductService.queryKeyFactory.product.list({ ...query }),
    )
  })

  it('does not include scenario in the query key contract', () => {
    const query: ProductListQuery = {
      q: '',
      category: 'all',
      sort: 'latest',
      page: 1,
      pageSize: 12,
    }
    const key = ProductService.queryKeyFactory.product.list(
      query,
    ) as ReadonlyArray<unknown>
    expect(key).not.toContain('scenario')
    expect(JSON.stringify(key)).not.toContain('scenario')
  })
})
