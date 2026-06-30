import type {
  ProductCategoryFilter,
  ProductListResponse,
  SortBy,
} from '../types'

type GetProductsParams = {
  category: ProductCategoryFilter
  sortBy: SortBy
  searchQuery: string
  page: number
  pageSize: number
  minPrice: number | ''
  maxPrice: number | ''
}

export const productService = {
  async getProducts(params: GetProductsParams): Promise<ProductListResponse> {
    const searchParams = new URLSearchParams({
      category: params.category,
      sort: params.sortBy,
      q: params.searchQuery,
      page: String(params.page),
      size: String(params.pageSize),
    })

    if (params.minPrice !== '') {
      searchParams.set('minPrice', String(params.minPrice))
    }

    if (params.maxPrice !== '') {
      searchParams.set('maxPrice', String(params.maxPrice))
    }

    const response = await fetch(`/api/products?${searchParams.toString()}`)

    if (!response.ok) {
      throw new Error(`API 호출 실패 (status: ${response.status})`)
    }

    return response.json()
  },
}
