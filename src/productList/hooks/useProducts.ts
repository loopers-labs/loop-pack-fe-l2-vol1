import { useEffect, useState } from 'react'
import { productService } from '../services/productService'
import type {
  Product,
  ProductCategoryFilter,
  ProductListResponse,
  SortBy,
} from '../types'

type GetProducts = typeof productService.getProducts

type UseProductsParams = {
  category: ProductCategoryFilter
  sortBy: SortBy
  searchQuery: string
  page: number
  pageSize: number
  minPrice: number | ''
  maxPrice: number | ''
  inStockOnly: boolean
  getProducts?: GetProducts
}

export function useProducts({
  category,
  sortBy,
  searchQuery,
  page,
  pageSize,
  minPrice,
  maxPrice,
  inStockOnly,
  getProducts = productService.getProducts,
}: UseProductsParams) {
  const [products, setProducts] = useState<Product[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [refetchKey, setRefetchKey] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    const fetchProducts = async () => {
      setIsLoading(true)
      setError(null)
      setHasLoaded(false)

      try {
        const data: ProductListResponse = await getProducts(
          {
            category,
            sortBy,
            searchQuery,
            page,
            pageSize,
            minPrice,
            maxPrice,
            inStockOnly,
          },
          controller.signal,
        )

        // 실제 fetch는 abort로 끊기지만, 주입된 getProducts가 signal을 무시할 수도
        // 있으므로 늦게 도착한 응답도 여기서 한 번 더 버린다.
        if (controller.signal.aborted) {
          return
        }

        setProducts(data.products)
        setTotalCount(data.totalCount)
        setHasLoaded(true)
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err as Error)
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    fetchProducts()

    // 이전 요청을 실제로 취소한다(ignore 플래그는 응답만 버릴 뿐 요청은 계속 나간다).
    return () => controller.abort()
  }, [
    category,
    sortBy,
    searchQuery,
    page,
    pageSize,
    minPrice,
    maxPrice,
    inStockOnly,
    getProducts,
    refetchKey,
  ])

  return {
    products,
    totalCount,
    isLoading,
    error,
    hasLoaded,
    refetch: () => setRefetchKey((key) => key + 1),
  }
}
