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
    let ignore = false

    const fetchProducts = async () => {
      setIsLoading(true)
      setError(null)
      setHasLoaded(false)

      try {
        const data: ProductListResponse = await getProducts({
          category,
          sortBy,
          searchQuery,
          page,
          pageSize,
          minPrice,
          maxPrice,
          inStockOnly,
        })

        if (ignore) {
          return
        }

        setProducts(data.products)
        setTotalCount(data.totalCount)
        setHasLoaded(true)
      } catch (err) {
        if (!ignore) {
          setError(err as Error)
        }
      } finally {
        if (!ignore) {
          setIsLoading(false)
        }
      }
    }

    fetchProducts()

    return () => {
      ignore = true
    }
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
