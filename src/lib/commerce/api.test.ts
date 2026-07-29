import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchProducts } from './api'

// 조건 객체가 요청 URL로 어떻게 펼쳐지는지만 검증한다.
// 실패 표현과 타임아웃은 전송 계층의 책임이라 shared/api/http.test.ts가 맡는다.

const defaultCondition = {
  q: '',
  category: 'all',
  sort: 'latest',
  page: 1,
  pageSize: 12,
} as const

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
