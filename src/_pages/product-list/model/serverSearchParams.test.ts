import { describe, expect, it } from 'vitest'
import {
  productListRequestUrl,
  type ProductListCondition,
} from '../api/productList'
import { createProductListCondition } from './searchParams'
import { loadProductListCondition } from './serverSearchParams'

// 서버와 브라우저가 같은 조건 객체를 만들어야 한다. 갈라지면 서버가 prefetch한 캐시를
// 브라우저가 못 알아보고 hydration 직후 같은 조건을 다시 요청한다.

const load = (searchParams: Record<string, string>) =>
  loadProductListCondition(Promise.resolve(searchParams))

describe('서버 로더가 만드는 조건', () => {
  it('브라우저가 같은 parser로 만든 조건과 같다', async () => {
    const { filters, condition } = await load({
      q: '니트',
      category: 'goods',
      sort: 'popular',
      page: '2',
      scenario: 'slow',
    })

    // 브라우저는 useQueryStates가 준 filters와 scenario로 같은 함수를 부른다.
    expect(condition).toEqual(createProductListCondition(filters, 'slow'))
  })

  it('잘못된 값과 공백 검색어를 브라우저와 같은 규칙으로 정규화한다', async () => {
    const { condition } = await load({
      q: '  ',
      category: 'unknown',
      sort: 'cheapest',
      page: '0',
      scenario: 'xxx',
    })

    expect(condition).toMatchObject({
      q: '',
      category: 'all',
      sort: 'latest',
      page: 1,
      scenario: null,
    })
  })

  it('pageSize는 URL이 아니라 조립 함수가 붙인다', async () => {
    const { condition } = await load({ pageSize: '99' })
    expect(condition.pageSize).toBe(12)
  })
})

describe('요청 URL', () => {
  const condition: ProductListCondition = {
    q: '니트',
    category: 'goods',
    sort: 'popular',
    page: 2,
    pageSize: 12,
    scenario: 'slow',
  }

  it('서버와 브라우저가 같은 경로와 query를 만든다', () => {
    const browser = productListRequestUrl(condition)
    const server = productListRequestUrl(condition, 'http://x.test')

    // 서버만 origin이 앞에 붙고, 그 뒤는 글자까지 같아야 한다.
    expect(server).toBe(`http://x.test${browser}`)
  })

  it('origin 끝의 슬래시 유무와 상관없이 같은 URL이 된다', () => {
    expect(productListRequestUrl(condition, 'http://x.test/')).toBe(
      productListRequestUrl(condition, 'http://x.test'),
    )
  })
})
