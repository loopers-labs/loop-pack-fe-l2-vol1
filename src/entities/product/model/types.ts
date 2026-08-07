import type { z } from 'zod'

import type {
  categoryResponseSchema,
  homeResponseSchema,
  productListResponseSchema,
  productSchema,
} from './ResponseSchema'

export type { MockApiScenario } from './DiagnosticScenario'

export type CategoryId = 'casual' | 'fashion' | 'goods' | 'home' | 'digital'

export type Category = z.infer<typeof categoryResponseSchema>

export type ProductSort = 'latest' | 'popular' | 'price-asc' | 'price-desc'

export type Product = z.infer<typeof productSchema>

export type HomeResponse = z.infer<typeof homeResponseSchema>

export type ProductListResponse = z.infer<typeof productListResponseSchema>
