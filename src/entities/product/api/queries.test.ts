import { describe, expect, it } from 'vitest'
import type { ProductListQuery } from './types'
import { productListQueryOptions } from './queries'

const QUERY: ProductListQuery = {
  q: '니트',
  category: 'fashion',
  sort: 'price-desc',
  page: 2,
  pageSize: 12,
  scenario: 'empty',
}

describe('상품 목록 query key', () => {
  it('URL에서 파생된 모든 목록 조건을 캐시 key에 포함한다', () => {
    expect(productListQueryOptions(QUERY).queryKey).toEqual(['products', QUERY])
  })

  it('목록 조건이 다르면 서로 다른 캐시 key를 만든다', () => {
    const firstPageKey = productListQueryOptions({
      ...QUERY,
      page: 1,
    }).queryKey
    const secondPageKey = productListQueryOptions({
      ...QUERY,
      page: 2,
    }).queryKey

    expect(firstPageKey).not.toEqual(secondPageKey)
  })

  it('서로 다른 객체로 만든 같은 기본 조건은 동일한 캐시 key를 만든다', () => {
    const defaults: ProductListQuery = {
      q: '',
      category: 'all',
      sort: 'latest',
      page: 1,
      pageSize: 12,
      scenario: null,
    }

    const firstKey = productListQueryOptions({ ...defaults }).queryKey
    const secondKey = productListQueryOptions({ ...defaults }).queryKey

    expect(firstKey).toEqual(secondKey)
  })
})
