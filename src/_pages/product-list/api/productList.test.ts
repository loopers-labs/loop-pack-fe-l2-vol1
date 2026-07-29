import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  fetchProducts,
  productListQueries,
  type ProductListCondition,
} from './productList'

// 조건 객체 하나가 key와 요청 양쪽의 근원이다. key만 다르거나 요청만 다르면
// 캐시가 화면과 어긋난다. 그래서 key 계층과 요청 URL을 같은 파일에서 검증한다.
// 실패 표현과 타임아웃은 전송 계층의 책임이라 shared/api/http.test.ts가 맡는다.

const defaultCondition: ProductListCondition = {
  q: '',
  category: 'all',
  sort: 'latest',
  page: 1,
  pageSize: 12,
}

const emptyListResponse = () =>
  new Response(
    JSON.stringify({
      products: [],
      categories: [],
      totalCount: 0,
      page: 1,
      pageSize: 12,
    }),
  )

const stubFetch = () => {
  const fetchMock = vi
    .fn<typeof fetch>()
    .mockImplementation(() => Promise.resolve(emptyListResponse()))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('fetchProducts', () => {
  it('기본 정렬을 포함한 모든 조건을 명시해 요청한다', async () => {
    const fetchMock = stubFetch()

    await fetchProducts(defaultCondition)

    expect(String(fetchMock.mock.calls[0][0])).toBe(
      '/api/products?category=all&sort=latest&page=1&pageSize=12',
    )
  })

  it('검색어가 있으면 q를 포함하고, 비어 있으면 뺀다', async () => {
    const fetchMock = stubFetch()

    await fetchProducts({
      q: '니트',
      category: 'casual',
      sort: 'price-asc',
      page: 2,
      pageSize: 12,
    })

    const requestedUrl = String(fetchMock.mock.calls[0][0])
    expect(requestedUrl).toContain('q=%EB%8B%88%ED%8A%B8')
    expect(requestedUrl).toContain('category=casual')
    expect(requestedUrl).toContain('sort=price-asc')
    expect(requestedUrl).toContain('page=2')
  })
})

describe('productListQueries', () => {
  it('일반에서 구체로 내려가는 목록 key 계층을 만든다', () => {
    const condition: ProductListCondition = {
      q: '니트',
      category: 'casual',
      sort: 'latest',
      page: 2,
      pageSize: 12,
    }

    expect(productListQueries.all()).toEqual(['products'])
    expect(productListQueries.lists()).toEqual(['products', 'list'])
    expect(productListQueries.list(condition).queryKey).toEqual([
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

    const pageChanged = productListQueries.list({ ...base, page: 2 })
    expect(pageChanged.queryKey).not.toEqual(
      productListQueries.list(base).queryKey,
    )
  })
})
