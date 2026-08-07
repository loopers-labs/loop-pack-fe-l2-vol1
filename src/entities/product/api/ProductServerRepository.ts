import type { DiagnosticScenario } from '@/entities/product/model/DiagnosticScenario'
import {
  type ProductListRequest,
  ProductListRequestModel,
} from '@/entities/product/model/ProductListRequest'
import {
  homeResponseSchema,
  productListResponseSchema,
} from '@/entities/product/model/ResponseSchema'
import type {
  HomeResponse,
  ProductListResponse,
} from '@/entities/product/model/types'
import {
  API_ERROR_FALLBACK_MESSAGE,
  ApiClientError,
} from '@/shared/api/ApiClientError'
import { ApiErrorResponseSchema } from '@/shared/api/ApiErrorResponse'
import type { AppOrigin } from '@/shared/config/AppOrigin'

import { ProductServerFetchError } from './ProductServerFetchError'

export class ProductServerRepository {
  constructor(
    private readonly fetch: typeof globalThis.fetch = globalThis.fetch,
  ) {}

  async getHome(
    diagnosticScenario: DiagnosticScenario,
    origin: AppOrigin,
  ): Promise<HomeResponse> {
    const input = new URL('api/home', `${origin}/`)
    if (diagnosticScenario.scenario !== undefined) {
      input.searchParams.set('scenario', diagnosticScenario.scenario)
    }
    const response = await this.fetchNative(input, { method: 'GET' })
    await this.throwForHttpError(response)
    const body: unknown = await response.json()
    return homeResponseSchema.parse(body)
  }

  async getProductList(
    request: ProductListRequest,
    origin: AppOrigin,
  ): Promise<ProductListResponse> {
    const descriptor = ProductListRequestModel.serverDescriptor(request, origin)
    const response = await this.fetchNative(descriptor.input, descriptor.init)

    await this.throwForHttpError(response)

    const body: unknown = await response.json()
    return productListResponseSchema.parse(body)
  }

  private async fetchNative(
    input: URL,
    init: Readonly<{ method: 'GET' }>,
  ): Promise<Response> {
    try {
      return await this.fetch(input, init)
    } catch (error) {
      if (error instanceof TypeError) {
        throw new ProductServerFetchError(error)
      }
      throw error
    }
  }

  private async throwForHttpError(response: Response): Promise<void> {
    if (!response.ok) {
      const text = await response.text()
      let body: unknown
      try {
        body = text === '' ? undefined : JSON.parse(text)
      } catch (error) {
        if (!(error instanceof SyntaxError)) {
          throw error
        }
        body = undefined
      }
      const result = ApiErrorResponseSchema.safeParse(body)
      throw new ApiClientError(
        result.success ? result.data.message : API_ERROR_FALLBACK_MESSAGE,
        response.status,
      )
    }
  }
}
