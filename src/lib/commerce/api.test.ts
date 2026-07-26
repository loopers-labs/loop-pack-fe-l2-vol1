import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, errorMessageOf, fetchProducts, isRetryable } from './api'

// 요청 URL이 조건 객체와 어긋나지 않는지, 실패가 throw로 승격되는지 검증한다.
// 실패는 status와 서버 메시지를 구조로 남겨야 소비자가 문자열을 파싱하지 않는다.

const defaultCondition = {
  q: '',
  category: 'all',
  sort: 'latest',
  page: 1,
  pageSize: 12,
} as const

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

    await expect(fetchProducts(defaultCondition)).rejects.toBeInstanceOf(
      ApiError,
    )
  })

  it('실패 응답의 status와 서버 메시지를 구조로 전달한다', async () => {
    stubFetch({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ message: '요청 조건을 확인해주세요.' }),
    })

    const error = await fetchProducts(defaultCondition).catch(
      (thrown: unknown) => thrown,
    )

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({
      status: 400,
      serverMessage: '요청 조건을 확인해주세요.',
    })
  })

  it('본문이 JSON이 아니면 status만 남기고 원래 실패를 가리지 않는다', async () => {
    // 프록시 오류 페이지나 빈 본문이 여기 해당한다.
    stubFetch({
      ok: false,
      status: 502,
      json: () => Promise.reject(new SyntaxError('Unexpected token <')),
    })

    const error = await fetchProducts(defaultCondition).catch(
      (thrown: unknown) => thrown,
    )

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 502, serverMessage: undefined })
    expect((error as ApiError).message).toContain('HTTP 502')
  })
})

describe('실패 분류', () => {
  it('400대는 재시도해도 결과가 같으므로 재시도 대상이 아니다', () => {
    expect(isRetryable(new ApiError(400))).toBe(false)
    expect(isRetryable(new ApiError(404))).toBe(false)
  })

  it('서버 오류와 네트워크 실패는 재시도 대상이다', () => {
    expect(isRetryable(new ApiError(500))).toBe(true)
    expect(isRetryable(new TypeError('Failed to fetch'))).toBe(true)
  })

  it('서버 메시지가 있으면 화면 문구 대신 그것을 쓴다', () => {
    expect(
      errorMessageOf(new ApiError(400, '조건을 확인해주세요.'), '기본'),
    ).toBe('조건을 확인해주세요.')
    expect(errorMessageOf(new ApiError(500), '기본')).toBe('기본')
    expect(errorMessageOf(new TypeError('Failed to fetch'), '기본')).toBe(
      '기본',
    )
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
