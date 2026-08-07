import type { DiagnosticScenario } from './DiagnosticScenario'
import type { ProductListRequest } from './ProductListRequest'

export class ProductQueryKeyFactory {
  private constructor() {}

  static home(diagnosticScenario: DiagnosticScenario) {
    return ['home', diagnosticScenario] as const
  }

  static productList(request: ProductListRequest) {
    return ['products', 'list', request] as const
  }
}
