import { afterEach, describe, expect, it, vi } from 'vitest'
import { productListQueryOptions } from './queries'

const QUERY = {
  q: '니트',
  category: 'fashion',
  sort: 'price-desc',
  page: 2,
  pageSize: 12,
  scenario: 'empty',
} as const

describe('상품 목록 query factory', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('응답을 바꾸는 모든 조건을 query key와 실제 GET에 함께 넣는다', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ products: [] }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const options = productListQueryOptions(QUERY)
    expect(options.queryKey).toEqual(['products', QUERY])

    await options.queryFn?.({ signal: new AbortController().signal } as never)

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/products?q=%EB%8B%88%ED%8A%B8&category=fashion&sort=price-desc&page=2&pageSize=12&scenario=empty',
      { signal: undefined },
    )
  })

  it('브라우저 실행에서는 TanStack Query의 AbortSignal을 fetch까지 전달한다', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ products: [] }),
    })
    const signal = new AbortController().signal
    vi.stubGlobal('window', {})
    vi.stubGlobal('fetch', fetchMock)

    await productListQueryOptions(QUERY).queryFn?.({ signal } as never)

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/products?q=%EB%8B%88%ED%8A%B8&category=fashion&sort=price-desc&page=2&pageSize=12&scenario=empty',
      { signal },
    )
  })
})
