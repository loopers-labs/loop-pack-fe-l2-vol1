import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { productService } from './services/productService'

describe('productService', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    globalThis.fetch = vi.fn<typeof fetch>()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    vi.restoreAllMocks()
  })

  it('requests products with the same query contract as the page used', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ products: [], totalCount: 0 }),
    } as Response)

    await productService.getProducts({
      category: 'electronics',
      sortBy: 'price-asc',
      searchQuery: 'keyboard',
      page: 2,
      pageSize: 12,
      minPrice: 10000,
      maxPrice: '',
      inStockOnly: true,
    })

    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/products?category=electronics&sort=price-asc&q=keyboard&page=2&size=12&minPrice=10000&inStock=true',
      { signal: undefined },
    )
  })

  it('keeps the existing API failure message', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response)

    await expect(
      productService.getProducts({
        category: 'all',
        sortBy: 'latest',
        searchQuery: '',
        page: 1,
        pageSize: 12,
        minPrice: '',
        maxPrice: '',
        inStockOnly: false,
      }),
    ).rejects.toThrow('API 호출 실패 (status: 500)')
  })
})
