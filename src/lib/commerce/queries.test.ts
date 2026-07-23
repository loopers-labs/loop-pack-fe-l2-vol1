import { describe, expect, it } from 'vitest'
import type { ProductListCondition } from './api'
import { productListQuery } from './queries'

// 조건 객체 하나가 key와 요청 양쪽의 근원이다. key만 다르거나 요청만 다르면
// 캐시가 화면과 어긋난다.

describe('productListQuery', () => {
  it('조건 객체가 그대로 query key가 된다', () => {
    const condition: ProductListCondition = {
      q: '니트',
      category: 'casual',
      sort: 'latest',
      page: 2,
      pageSize: 12,
    }

    expect(productListQuery(condition).queryKey).toEqual([
      'products',
      condition,
    ])
  })

  it('조건이 다르면 key도 달라 다른 캐시를 쓴다', () => {
    const base: ProductListCondition = {
      q: '',
      category: 'all',
      sort: 'latest',
      page: 1,
      pageSize: 12,
    }

    const pageChanged = productListQuery({ ...base, page: 2 })
    expect(pageChanged.queryKey).not.toEqual(productListQuery(base).queryKey)
  })
})
