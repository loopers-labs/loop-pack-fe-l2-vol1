import type { ProductListRequest } from './ProductListRequest'
import { ProductListRequestModel } from './ProductListRequest'
import { DEFAULT_PAGE_SIZE } from './ProductQuerySchema'

type NextSearchParams = Readonly<
  Record<string, string | ReadonlyArray<string> | undefined>
>

export type ProductListRouteInput =
  | NextSearchParams
  | Pick<URLSearchParams, 'get'>

const requestFields = ['q', 'category', 'sort', 'page', 'scenario'] as const

function isSearchParams(
  input: ProductListRouteInput,
): input is Pick<URLSearchParams, 'get'> {
  return typeof input.get === 'function'
}

export class ProductListRouteParams {
  private constructor() {}

  static toRequest(input: ProductListRouteInput): ProductListRequest {
    const values: Record<string, string | undefined> = {}

    for (const field of requestFields) {
      if (isSearchParams(input)) {
        values[field] = input.get(field) ?? undefined
        continue
      }

      const value = input[field]
      values[field] = typeof value === 'string' ? value : value?.[0]
    }

    return ProductListRequestModel.normalize({
      ...values,
      pageSize: DEFAULT_PAGE_SIZE,
    })
  }

  static canonicalSearchParams(request: ProductListRequest): URLSearchParams {
    const searchParams = new URLSearchParams()
    if (request.q !== '') {
      searchParams.set('q', request.q)
    }
    if (request.category !== 'all') {
      searchParams.set('category', request.category)
    }
    searchParams.set('sort', request.sort)
    searchParams.set('page', String(request.page))
    return searchParams
  }
}
