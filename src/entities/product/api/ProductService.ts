import { queryOptions } from '@tanstack/react-query'

import type { DiagnosticScenario } from '@/entities/product/model/DiagnosticScenario'
import { type ProductListRequest } from '@/entities/product/model/ProductListRequest'
import { ProductQueryKeyFactory } from '@/entities/product/model/ProductQueryKeyFactory'

import { ProductRepository } from './ProductRepository'

export class ProductService {
  constructor(
    private readonly repository: ProductRepository = new ProductRepository(),
  ) {}

  getHome(diagnosticScenario: DiagnosticScenario) {
    return queryOptions({
      queryKey: ProductQueryKeyFactory.home(diagnosticScenario),
      queryFn: () => this.repository.getHome(diagnosticScenario),
      staleTime: 60_000,
    })
  }

  getProductList(request: ProductListRequest) {
    return queryOptions({
      queryKey: ProductQueryKeyFactory.productList(request),
      queryFn: ({ signal }) => this.repository.getProductList(request, signal),
      placeholderData: (previousData) => previousData,
      staleTime: 30_000,
      throwOnError: false,
    })
  }
}

export const productEntity = new ProductService()
