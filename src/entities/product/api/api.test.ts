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
    expect(fetchMock).toHaveBeenCalledWith('/api/products?page=1&pageSize=12')
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
