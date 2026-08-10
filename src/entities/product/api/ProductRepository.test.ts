import { delay, http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import * as z from 'zod'

import type { DiagnosticScenario } from '@/entities/product/model/DiagnosticScenario'
import { ProductListRequestModel } from '@/entities/product/model/ProductListRequest'
import { apiClient } from '@/shared/api/ApiClient'

import { server } from '../../../../tests/setup/mswServer'
import { ProductRepository } from './ProductRepository'

const nodeApiClient = apiClient.extend({ baseUrl: 'https://example.test/' })
const productResponse = {
  products: [],
  categories: [],
  totalCount: 0,
  page: 2,
  pageSize: 12,
} as const
const homeResponse = {
  banner: {
    title: 'title',
    description: 'description',
    image: '/hero.jpg',
  },
  categories: [],
  popularProducts: [],
  newProducts: [],
} as const

describe('ProductRepository successful response boundary', () => {
  it('throws a schema error without another request for malformed 2xx data', async () => {
    let requestCount = 0
    server.use(
      http.get('https://example.test/api/home', () => {
        requestCount += 1
        return HttpResponse.json({ unexpected: true })
      }),
    )

    await expect(
      new ProductRepository(nodeApiClient).getHome({}),
    ).rejects.toBeInstanceOf(z.ZodError)
    expect(requestCount).toBe(1)
  })
})

describe('ProductRepository browser requests', () => {
  it('sends one canonical GET request', async () => {
    let requestedMethod = ''
    let requestedUrl = ''
    server.use(
      http.get('https://example.test/api/products', ({ request }) => {
        requestedMethod = request.method
        requestedUrl = request.url
        return HttpResponse.json(productResponse)
      }),
    )
    const request = ProductListRequestModel.normalize({
      q: 'stanley',
      category: 'home',
      sort: 'price-asc',
      page: 2,
      scenario: 'slow',
    })

    await new ProductRepository(nodeApiClient).getProductList(request)

    expect(requestedMethod).toBe('GET')
    expect(requestedUrl).toBe(
      'https://example.test/api/products?q=stanley&category=home&sort=price-asc&page=2&pageSize=12&scenario=slow',
    )
  })

  it('preserves URL parity across unsignaled and signaled requests', async () => {
    const requestedUrls: Array<string> = []
    server.use(
      http.get('https://example.test/api/products', ({ request }) => {
        requestedUrls.push(request.url)
        return HttpResponse.json(productResponse)
      }),
    )
    const repository = new ProductRepository(nodeApiClient)
    const request = ProductListRequestModel.normalize({ q: 'stanley' })
    const controller = new AbortController()

    await repository.getProductList(request)
    await repository.getProductList(request, controller.signal)

    expect(requestedUrls).toEqual([
      'https://example.test/api/products?q=stanley&sort=latest&page=1&pageSize=12',
      'https://example.test/api/products?q=stanley&sort=latest&page=1&pageSize=12',
    ])
  })

  it('aborts the Ky request when the supplied signal aborts', async () => {
    let markRequestStarted: () => void = () => undefined
    const requestStarted = new Promise<void>((resolve) => {
      markRequestStarted = resolve
    })
    server.use(
      http.get('https://example.test/api/products', async () => {
        markRequestStarted()
        await delay('infinite')
        return HttpResponse.json(productResponse)
      }),
    )
    const controller = new AbortController()
    const productRequest = new ProductRepository(nodeApiClient).getProductList(
      ProductListRequestModel.normalize({ q: 'stanley', scenario: 'slow' }),
      controller.signal,
    )

    await requestStarted
    controller.abort()

    await expect(productRequest).rejects.toHaveProperty('name', 'AbortError')
  })
})

const scenarioCases = [
  [{}, null],
  [{ scenario: 'slow' }, 'slow'],
  [{ scenario: 'empty' }, 'empty'],
  [{ scenario: 'error' }, 'error'],
] as const satisfies ReadonlyArray<readonly [DiagnosticScenario, string | null]>

describe('ProductRepository home diagnostic scenarios', () => {
  it.each(scenarioCases)(
    'keeps the home GET scenario aligned with the request URL',
    async (diagnosticScenario, expectedScenario) => {
      let requestedUrl = ''
      server.use(
        http.get('https://example.test/api/home', ({ request }) => {
          requestedUrl = request.url
          return HttpResponse.json(homeResponse)
        }),
      )

      await new ProductRepository(nodeApiClient).getHome(diagnosticScenario)

      expect(new URL(requestedUrl).searchParams.get('scenario')).toBe(
        expectedScenario,
      )
    },
  )
})
