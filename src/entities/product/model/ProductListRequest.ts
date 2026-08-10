import type { Options } from 'ky'
import * as z from 'zod'

import { mockApiScenarioSchema } from '@/entities/product/model/DiagnosticScenario'
import {
  categorySchema,
  DEFAULT_PAGE_SIZE,
  pageSchema,
  querySchema,
  sortSchema,
} from '@/entities/product/model/ProductQuerySchema'
import type { AppOrigin } from '@/shared/config/AppOrigin'

export const productListRequestSchema = z
  .object({
    q: querySchema.default(''),
    category: categorySchema.catch('all').default('all'),
    sort: sortSchema.catch('latest').default('latest'),
    page: pageSchema.default(1),
    pageSize: z
      .number()
      .int()
      .positive()
      .max(24)
      .catch(DEFAULT_PAGE_SIZE)
      .default(DEFAULT_PAGE_SIZE),
    scenario: mockApiScenarioSchema.optional(),
  })
  .readonly()

export type ProductListRequest = z.infer<typeof productListRequestSchema>

export type BrowserProductListDescriptor = Readonly<{
  input: 'api/products'
  options: Options
}>

export type ServerProductListDescriptor = Readonly<{
  input: URL
  init: Readonly<{ method: 'GET' }>
}>

const canonicalIntegerPattern = /^[1-9]\d*$/

function normalizePositiveSafeInteger(input: unknown): number | undefined {
  if (typeof input === 'number') {
    return Number.isSafeInteger(input) && input > 0 ? input : undefined
  }

  if (typeof input !== 'string' || !canonicalIntegerPattern.test(input)) {
    return undefined
  }

  const parsed = Number(input)
  return Number.isSafeInteger(parsed) ? parsed : undefined
}

export class ProductListRequestModel {
  private constructor() {}

  static normalize(input: unknown): ProductListRequest {
    const recordResult = z.record(z.string(), z.unknown()).safeParse(input)
    const source = recordResult.success ? recordResult.data : {}
    const scenarioResult = mockApiScenarioSchema.safeParse(
      typeof source.scenario === 'string' ? source.scenario : undefined,
    )

    return productListRequestSchema.parse({
      q: typeof source.q === 'string' ? source.q : undefined,
      category:
        typeof source.category === 'string' ? source.category : undefined,
      sort: typeof source.sort === 'string' ? source.sort : undefined,
      page: normalizePositiveSafeInteger(source.page),
      pageSize: normalizePositiveSafeInteger(source.pageSize),
      ...(scenarioResult.success ? { scenario: scenarioResult.data } : {}),
    })
  }

  static searchParams(request: ProductListRequest): URLSearchParams {
    const searchParams = new URLSearchParams()
    if (request.q !== '') {
      searchParams.set('q', request.q)
    }
    if (request.category !== 'all') {
      searchParams.set('category', request.category)
    }
    searchParams.set('sort', request.sort)
    searchParams.set('page', String(request.page))
    searchParams.set('pageSize', String(request.pageSize))
    if (request.scenario !== undefined) {
      searchParams.set('scenario', request.scenario)
    }
    return searchParams
  }

  static browserDescriptor(
    request: ProductListRequest,
    signal?: AbortSignal,
  ): BrowserProductListDescriptor {
    const options: Options = {
      searchParams: ProductListRequestModel.searchParams(request),
    }
    return {
      input: 'api/products',
      options: signal === undefined ? options : { ...options, signal },
    }
  }

  static serverDescriptor(
    request: ProductListRequest,
    origin: AppOrigin,
  ): ServerProductListDescriptor {
    const input = new URL('api/products', `${origin}/`)
    input.search = ProductListRequestModel.searchParams(request).toString()
    return { input, init: { method: 'GET' } }
  }
}
