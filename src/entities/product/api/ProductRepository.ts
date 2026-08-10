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
import { apiClient } from '@/shared/api/ApiClient'

export class ProductRepository {
  constructor(private readonly api: typeof apiClient = apiClient) {}

  readonly endpoints = {
    home: 'api/home',
  } as const

  async getHome(diagnosticScenario: DiagnosticScenario): Promise<HomeResponse> {
    const json = await this.api
      .get(this.endpoints.home, {
        searchParams: { scenario: diagnosticScenario.scenario },
      })
      .json<unknown>()
    return homeResponseSchema.parse(json)
  }

  async getProductList(
    request: ProductListRequest,
    signal?: AbortSignal,
  ): Promise<ProductListResponse> {
    const descriptor = ProductListRequestModel.browserDescriptor(
      request,
      signal,
    )
    const json = await this.api
      .get(descriptor.input, descriptor.options)
      .json<unknown>()
    return productListResponseSchema.parse(json)
  }
}
