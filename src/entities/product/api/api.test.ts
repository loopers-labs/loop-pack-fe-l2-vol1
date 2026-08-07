import { afterEach, describe, expect, it, vi } from 'vitest'
import { getProductList } from './api'

describe('getProductList', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('고정 pageSize를 포함해 상품 목록을 요청한다', async () => {
    const response = {
      products: [],
      totalCount: 0,
      page: 1,
      pageSize: 12,
    }
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(response), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(getProductList({ page: 1 })).resolves.toEqual(response)
    // base origin은 실행 환경(APP_ORIGIN·PORT)에 따라 달라지므로 쿼리 직렬화 결과만 단언한다.
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/products?page=1&pageSize=12'),
      { signal: undefined },
    )
  })

  it('호출자가 넘긴 AbortSignal을 요청에 연결한다', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ products: [] }))
    vi.stubGlobal('fetch', fetchMock)
    const controller = new AbortController()

    await getProductList({ page: 1 }, controller.signal)

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/products?page=1&pageSize=12'),
      { signal: controller.signal },
    )
  })

  it('취소된 요청은 네트워크 오류로 바꾸지 않는다', async () => {
    const controller = new AbortController()
    controller.abort()
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new DOMException('The operation was aborted.', 'AbortError')),
    )

    await expect(getProductList({ page: 1 }, controller.signal)).rejects.toMatchObject({
      name: 'AbortError',
    })
  })

  it('HTTP 오류의 status를 보존한다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 500 })))

    await expect(getProductList({ page: 1 })).rejects.toMatchObject({
      name: 'ApiError',
      kind: 'http',
      status: 500,
    })
  })

  it('fetch 실패를 네트워크 오류로 변환한다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    await expect(getProductList({ page: 1 })).rejects.toMatchObject({
      name: 'ApiError',
      kind: 'network',
    })
  })
})
