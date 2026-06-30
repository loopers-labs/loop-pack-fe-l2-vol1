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

  useEffect(() => {
    let ignore = false

    const fetchProducts = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const data: ProductListResponse = await getProducts({
          category,
          sortBy,
          searchQuery,
          page,
          pageSize,
          minPrice,
          maxPrice,
        })

        if (ignore) {
          return
        }

        const filtered = inStockOnly
          ? data.products.filter((product) => product.stock > 0)
          : data.products

        setProducts(filtered)
        setTotalCount(data.totalCount)
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
  ])

  return {
    products,
    totalCount,
    isLoading,
    error,
  }
}
