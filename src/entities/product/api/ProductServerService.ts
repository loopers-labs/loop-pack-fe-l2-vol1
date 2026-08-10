import { queryOptions } from '@tanstack/react-query'

import { ProductServerRepository } from '@/entities/product/api/ProductServerRepository'
import type { DiagnosticScenario } from '@/entities/product/model/DiagnosticScenario'
import { type ProductListRequest } from '@/entities/product/model/ProductListRequest'
import { ProductQueryKeyFactory } from '@/entities/product/model/ProductQueryKeyFactory'
import type { AppOrigin } from '@/shared/config/AppOrigin'

export class ProductServerService {
  constructor(
    private readonly repository: ProductServerRepository = new ProductServerRepository(),
  ) {}

  getHome(diagnosticScenario: DiagnosticScenario, origin: AppOrigin) {
    return queryOptions({
      queryKey: ProductQueryKeyFactory.home(diagnosticScenario),
      queryFn: () => this.repository.getHome(diagnosticScenario, origin),
      staleTime: 60_000,
    })
  }

  getProductList(request: ProductListRequest, origin: AppOrigin) {
    return queryOptions({
      queryKey: ProductQueryKeyFactory.productList(request),
      queryFn: () => this.repository.getProductList(request, origin),
      staleTime: 30_000,
    })
  }
}
