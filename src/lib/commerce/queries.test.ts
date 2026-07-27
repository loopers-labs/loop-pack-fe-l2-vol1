import { describe, expect, it } from 'vitest'
import type { ProductListCondition } from './api'
import { commerceQueries } from './queries'

// 조건 객체 하나가 key와 요청 양쪽의 근원이다. key만 다르거나 요청만 다르면
// 캐시가 화면과 어긋난다.

describe('commerceQueries.products', () => {
  it('일반에서 구체로 내려가는 목록 key 계층을 만든다', () => {
    const condition: ProductListCondition = {
      q: '니트',
      category: 'casual',
      sort: 'latest',
      page: 2,
      pageSize: 12,
    }

    expect(commerceQueries.products.all()).toEqual(['products'])
    expect(commerceQueries.products.lists()).toEqual(['products', 'list'])
    expect(commerceQueries.products.list(condition).queryKey).toEqual([
      'products',
      'list',
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

    const pageChanged = commerceQueries.products.list({ ...base, page: 2 })
    expect(pageChanged.queryKey).not.toEqual(
      commerceQueries.products.list(base).queryKey,
    )
  })
})
