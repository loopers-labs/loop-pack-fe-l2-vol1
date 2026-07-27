import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchProducts } from './api'

// 요청 URL이 조건 객체와 어긋나지 않는지, 실패가 throw로 승격되는지 검증한다.

const stubFetch = (response: Partial<Response>) => {
  const fetchMock = vi.fn().mockResolvedValue(response as Response)
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

const emptyListResponse = {
  ok: true,
  json: () =>
    Promise.resolve({
      products: [],
      categories: [],
      totalCount: 0,
      page: 1,
      pageSize: 12,
    }),
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('fetchProducts', () => {
  it('기본 정렬을 포함한 모든 조건을 명시해 요청한다', async () => {
    const fetchMock = stubFetch(emptyListResponse)

    await fetchProducts({
      q: '',
      category: 'all',
      sort: 'latest',
      page: 1,
      pageSize: 12,
    })

    const requestedUrl = String(fetchMock.mock.calls[0][0])
    expect(requestedUrl).toBe(
      '/api/products?category=all&sort=latest&page=1&pageSize=12',
    )
  })

  it('검색어가 있으면 q를 포함하고, 비어 있으면 뺀다', async () => {
    const fetchMock = stubFetch(emptyListResponse)

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

  it('HTTP 실패는 throw로 승격된다. 쿼리가 에러 상태를 알 수 있는 유일한 길이다', async () => {
    stubFetch({ ok: false, status: 500 })

    await expect(
      fetchProducts({
        q: '',
        category: 'all',
        sort: 'latest',
        page: 1,
        pageSize: 12,
      }),
    ).rejects.toThrow('HTTP 500')
  })

  it('쿼리 취소 신호를 fetch까지 전달한다', async () => {
    const fetchMock = stubFetch(emptyListResponse)
    const controller = new AbortController()

    await fetchProducts(
      {
        q: '',
        category: 'all',
        sort: 'latest',
        page: 1,
        pageSize: 12,
      },
      controller.signal,
    )

    expect(fetchMock).toHaveBeenCalledWith(expect.any(String), {
      signal: controller.signal,
    })
  })
})
