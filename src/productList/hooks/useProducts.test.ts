import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useProducts } from './useProducts'
import type { Product, ProductListResponse } from '../types'

function createProduct(id: number, stock = 10): Product {
  return {
    id,
    name: `상품 ${id}`,
    category: 'electronics',
    price: 10000,
    stock,
    imageUrl: `/product-${id}.png`,
    createdAt: '2026-06-30T00:00:00.000Z',
    rating: 4.5,
    reviewCount: 100,
  }
}

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })

  return { promise, resolve, reject }
}

describe('useProducts', () => {
  const baseParams = {
    category: 'all' as const,
    sortBy: 'latest' as const,
    searchQuery: '',
    pageSize: 12,
    minPrice: '' as const,
    maxPrice: '' as const,
  }

  it('keeps only the latest response when requests resolve out of order', async () => {
    const first = deferred<ProductListResponse>()
    const second = deferred<ProductListResponse>()
    const getProducts = vi
      .fn()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)

    const { result, rerender } = renderHook(
      ({ page }) =>
        useProducts({
          ...baseParams,
          page,
          inStockOnly: false,
          getProducts,
        }),
      { initialProps: { page: 1 } },
    )

    rerender({ page: 2 })

    await act(async () => {
      second.resolve({ products: [createProduct(2)], totalCount: 1 })
    })

    await waitFor(() => {
      expect(result.current.products.map((product) => product.id)).toEqual([2])
    })

    await act(async () => {
      first.resolve({ products: [createProduct(1)], totalCount: 1 })
    })

    expect(result.current.products.map((product) => product.id)).toEqual([2])
  })

  it('passes the in-stock-only option to the product service', async () => {
    const getProducts = vi.fn().mockResolvedValue({
      products: [createProduct(1, 0), createProduct(2, 3)],
      totalCount: 2,
    })

    const { result } = renderHook(() =>
      useProducts({
        ...baseParams,
        page: 1,
        inStockOnly: true,
        getProducts,
      }),
    )

    await waitFor(() => {
      expect(result.current.products.map((product) => product.id)).toEqual([
        1, 2,
      ])
    })
    expect(getProducts).toHaveBeenCalledWith({
      ...baseParams,
      page: 1,
      inStockOnly: true,
    })
    expect(result.current.totalCount).toBe(2)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })
})
