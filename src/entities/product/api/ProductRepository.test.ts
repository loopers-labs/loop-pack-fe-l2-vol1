import { describe, expect, it, vi } from 'vitest'
import * as z from 'zod'

import type { DiagnosticScenario } from '@/entities/product/model/DiagnosticScenario'
import { ProductListRequestModel } from '@/entities/product/model/ProductListRequest'
import { apiClient } from '@/shared/api/ApiClient'

import { ProductRepository } from './ProductRepository'

const productResponse = {
  products: [],
  categories: [],
  totalCount: 0,
  page: 2,
  pageSize: 12,
} as const

describe('ProductRepository successful response boundary', () => {
  it('throws a schema error without another attempt for malformed 2xx data', async () => {
    let attemptCount = 0
    const api = apiClient.extend({
      baseUrl: 'https://example.test/',
      fetch: () => {
        attemptCount += 1
        return Promise.resolve(Response.json({ unexpected: true }))
      },
    })

    await expect(new ProductRepository(api).getHome({})).rejects.toBeInstanceOf(
      z.ZodError,
    )
    expect(attemptCount).toBe(1)
  })
})

describe('ProductRepository browser requests', () => {
  it('uses the canonical relative descriptor without a signal by default', async () => {
    let requestedMethod = ''
    let requestedUrl = ''
    const api = apiClient.extend({
      baseUrl: 'https://example.test/',
      fetch: (request) => {
        const productRequest = new Request(request)
        requestedMethod = productRequest.method
        requestedUrl = productRequest.url
        return Promise.resolve(Response.json(productResponse))
      },
    })
    const get = vi.spyOn(api, 'get')
    const request = ProductListRequestModel.normalize({
      q: 'stanley',
      category: 'home',
      sort: 'price-asc',
      page: 2,
      scenario: 'slow',
    })

    await new ProductRepository(api).getProductList(request)

    expect(requestedMethod).toBe('GET')
    expect(requestedUrl).toBe(
      'https://example.test/api/products?q=stanley&category=home&sort=price-asc&page=2&pageSize=12&scenario=slow',
    )
    const [input, options] = get.mock.calls[0] ?? []
    const searchParams = options?.searchParams
    expect(input).toBe('api/products')
    expect(searchParams).toBeInstanceOf(URLSearchParams)
    if (!(searchParams instanceof URLSearchParams)) {
      return
    }
    expect(searchParams.toString()).toBe(
      'q=stanley&category=home&sort=price-asc&page=2&pageSize=12&scenario=slow',
    )
    expect(Object.hasOwn(options ?? {}, 'signal')).toBe(false)
  })

  it('preserves URL parity and AbortSignal identity when supplied', async () => {
    const requestedUrls: Array<string> = []
    const api = apiClient.extend({
      baseUrl: 'https://example.test/',
      fetch: (request) => {
        requestedUrls.push(new Request(request).url)
        return Promise.resolve(Response.json(productResponse))
      },
    })
    const get = vi.spyOn(api, 'get')
    const repository = new ProductRepository(api)
    const request = ProductListRequestModel.normalize({ q: 'stanley' })
    const controller = new AbortController()

    await repository.getProductList(request)
    await repository.getProductList(request, controller.signal)

    expect(requestedUrls[0]).toBe(requestedUrls[1])
    expect(Object.hasOwn(get.mock.calls[0]?.[1] ?? {}, 'signal')).toBe(false)
    expect(get.mock.calls[1]?.[1]?.signal).toBe(controller.signal)
  })

  it('aborts the Ky request when the transport signal aborts', async () => {
    let requestSignal: AbortSignal | undefined
    let markRequestStarted: () => void = () => undefined
    const requestStarted = new Promise<void>((resolve) => {
      markRequestStarted = resolve
    })
    const api = apiClient.extend({
      baseUrl: 'https://example.test/',
      fetch: (request) => {
        const transportRequest = new Request(request)
        requestSignal = transportRequest.signal
        markRequestStarted()
        return new Promise<Response>((_resolve, reject) => {
          transportRequest.signal.addEventListener(
            'abort',
            () => {
              reject(new DOMException('The request was aborted.', 'AbortError'))
            },
            { once: true },
          )
        })
      },
    })
    const controller = new AbortController()
    const productRequest = new ProductRepository(api).getProductList(
      ProductListRequestModel.normalize({ q: 'stanley', scenario: 'slow' }),
      controller.signal,
    )

    await requestStarted
    controller.abort()

    await expect(productRequest).rejects.toHaveProperty('name', 'AbortError')
    expect(requestSignal?.aborted).toBe(true)
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
    'keeps the home GET scenario aligned with the descriptor',
    async (diagnosticScenario, expectedScenario) => {
      let requestedUrl = ''
      const api = apiClient.extend({
        baseUrl: 'https://example.test/',
        fetch: (request) => {
          requestedUrl = new Request(request).url
          return Promise.resolve(
            Response.json({
              banner: {
                title: 'title',
                description: 'description',
                image: '/hero.jpg',
              },
              categories: [],
              popularProducts: [],
              newProducts: [],
            }),
          )
        },
      })

      await new ProductRepository(api).getHome(diagnosticScenario)

      expect(new URL(requestedUrl).searchParams.get('scenario')).toBe(
        expectedScenario,
      )
    },
  )
})
