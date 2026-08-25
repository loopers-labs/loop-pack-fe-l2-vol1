import '@/test/setup/msw'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { fetchProducts } from '@/entities/product/api/api'
import { productListQueryOptions } from '@/entities/product/api/queries'
import { defaultProductListResponse } from '@/test/fixtures/products'
import { server } from '@/test/mocks/server'

const PRODUCTS_ENDPOINT = 'http://localhost:3000/api/products'

describe('jsdom HTTP 경계', () => {
  it('브라우저 상대 URL 요청을 MSW까지 전달한다', async () => {
    const response = await fetchProducts({
      q: '',
      category: 'all',
      sort: 'latest',
      page: 1,
      pageSize: 12,
    })

    expect(response.totalCount).toBe(3)
    expect(response.products).toHaveLength(3)
  })

  it('모든 목록 조건을 실제 HTTP query parameter로 직렬화한다', async () => {
    let requestedUrl: URL | undefined
    server.use(
      http.get(PRODUCTS_ENDPOINT, ({ request }) => {
        requestedUrl = new URL(request.url)
        return HttpResponse.json(defaultProductListResponse)
      }),
    )

    await fetchProducts({
      q: '니트 가디건',
      category: 'fashion',
      sort: 'price-desc',
      page: 2,
      pageSize: 24,
      scenario: 'empty',
    })

    expect(requestedUrl?.searchParams.get('q')).toBe('니트 가디건')
    expect(requestedUrl?.searchParams.get('category')).toBe('fashion')
    expect(requestedUrl?.searchParams.get('sort')).toBe('price-desc')
    expect(requestedUrl?.searchParams.get('page')).toBe('2')
    expect(requestedUrl?.searchParams.get('pageSize')).toBe('24')
    expect(requestedUrl?.searchParams.get('scenario')).toBe('empty')
  })

  it('상품 목록 queryFn이 받은 취소 신호를 실제 Fetch Request까지 전달한다', async () => {
    let observedSignal: AbortSignal | undefined
    let notifyHandlerStarted: (() => void) | undefined
    const handlerStarted = new Promise<void>((resolve) => {
      notifyHandlerStarted = resolve
    })
    server.use(
      http.get(PRODUCTS_ENDPOINT, async ({ request }) => {
        observedSignal = request.signal
        notifyHandlerStarted?.()
        await new Promise<void>((resolve) => {
          request.signal.addEventListener('abort', () => resolve(), {
            once: true,
          })
        })
        return HttpResponse.json(defaultProductListResponse)
      }),
    )
    const controller = new AbortController()
    const queryFn = productListQueryOptions({}).queryFn

    if (typeof queryFn !== 'function') {
      throw new Error('상품 목록 queryFn이 정의되어야 합니다.')
    }

    const request = queryFn({
      signal: controller.signal,
    } as never)
    await handlerStarted
    controller.abort()

    expect(observedSignal?.aborted).toBe(true)
    await expect(request).rejects.toMatchObject({ name: 'AbortError' })
  })
})
