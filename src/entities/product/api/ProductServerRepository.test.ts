import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import * as z from 'zod'

import type { DiagnosticScenario } from '@/entities/product/model/DiagnosticScenario'
import { ProductListRequestModel } from '@/entities/product/model/ProductListRequest'
import { ApiClientError } from '@/shared/api/ApiClientError'
import { parseAppOrigin } from '@/shared/config/AppOrigin'

import { server } from '../../../../tests/setup/mswServer'
import { ProductServerFetchError } from './ProductServerFetchError'
import { ProductServerRepository } from './ProductServerRepository'

const origin = parseAppOrigin('https://shop.example')
const request = ProductListRequestModel.normalize({
  q: 'stanley',
  category: 'home',
  page: 2,
  scenario: 'slow',
})
const validResponse = {
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

describe('ProductServerRepository success boundary', () => {
  it('sends one canonical absolute GET request', async () => {
    let requestedMethod = ''
    let requestedUrl = ''
    server.use(
      http.get('https://shop.example/api/products', ({ request }) => {
        requestedMethod = request.method
        requestedUrl = request.url
        return HttpResponse.json(validResponse)
      }),
    )

    await expect(
      new ProductServerRepository().getProductList(request, origin),
    ).resolves.toEqual(validResponse)

    expect(requestedMethod).toBe('GET')
    expect(requestedUrl).toBe(
      'https://shop.example/api/products?q=stanley&category=home&sort=latest&page=2&pageSize=12&scenario=slow',
    )
  })

  it('passes through malformed success JSON as SyntaxError', async () => {
    server.use(
      http.get(
        'https://shop.example/api/products',
        () =>
          new HttpResponse('{', {
            headers: { 'content-type': 'application/json' },
          }),
      ),
    )

    await expect(
      new ProductServerRepository().getProductList(request, origin),
    ).rejects.toBeInstanceOf(SyntaxError)
  })

  it('passes through parsed invalid success data as ZodError', async () => {
    server.use(
      http.get('https://shop.example/api/products', () =>
        HttpResponse.json({ unexpected: true }),
      ),
    )

    await expect(
      new ProductServerRepository().getProductList(request, origin),
    ).rejects.toBeInstanceOf(z.ZodError)
  })

  it('wraps a network TypeError with its original cause after one request', async () => {
    let requestCount = 0
    server.use(
      http.get('https://shop.example/api/products', () => {
        requestCount += 1
        return HttpResponse.error()
      }),
    )

    const error = await new ProductServerRepository()
      .getProductList(request, origin)
      .catch((reason: unknown) => reason)

    expect(error).toBeInstanceOf(ProductServerFetchError)
    if (!(error instanceof ProductServerFetchError)) {
      return
    }
    expect(error.cause).toBeInstanceOf(TypeError)
    expect(requestCount).toBe(1)
  })
})

const homeScenarioCases = [
  [{}, 'https://shop.example/api/home'],
  [{ scenario: 'slow' }, 'https://shop.example/api/home?scenario=slow'],
  [{ scenario: 'empty' }, 'https://shop.example/api/home?scenario=empty'],
  [{ scenario: 'error' }, 'https://shop.example/api/home?scenario=error'],
] as const satisfies ReadonlyArray<readonly [DiagnosticScenario, string]>

describe('ProductServerRepository home requests', () => {
  it.each(homeScenarioCases)(
    'keeps the diagnostic scenario aligned with the absolute request URL',
    async (diagnosticScenario, expectedUrl) => {
      let requestedUrl = ''
      server.use(
        http.get('https://shop.example/api/home', ({ request }) => {
          requestedUrl = request.url
          return HttpResponse.json(homeResponse)
        }),
      )

      await expect(
        new ProductServerRepository().getHome(diagnosticScenario, origin),
      ).resolves.toEqual(homeResponse)
      expect(requestedUrl).toBe(expectedUrl)
    },
  )
})

describe('ProductServerRepository HTTP error boundary', () => {
  it('uses a valid API error message and status', async () => {
    server.use(
      http.get('https://shop.example/api/products', () =>
        HttpResponse.json({ message: '재고 없음' }, { status: 409 }),
      ),
    )

    await expect(
      new ProductServerRepository().getProductList(request, origin),
    ).rejects.toEqual(new ApiClientError('재고 없음', 409))
  })

  it.each([
    ['empty', ''],
    ['malformed JSON', '{'],
    ['schema-invalid JSON', JSON.stringify({ message: '' })],
  ])('uses the fallback for %s error text', async (_label, body) => {
    server.use(
      http.get(
        'https://shop.example/api/products',
        () => new HttpResponse(body, { status: 503 }),
      ),
    )

    await expect(
      new ProductServerRepository().getProductList(request, origin),
    ).rejects.toEqual(new ApiClientError('요청 중 오류가 발생했습니다.', 503))
  })
})
