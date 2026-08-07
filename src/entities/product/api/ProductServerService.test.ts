import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'

import { ProductListRequestModel } from '@/entities/product/model/ProductListRequest'
import { parseAppOrigin } from '@/shared/config/AppOrigin'

import { ProductServerRepository } from './ProductServerRepository'
import { ProductServerService } from './ProductServerService'
import { ProductService } from './ProductService'

const request = ProductListRequestModel.normalize({ scenario: 'slow' })
const origin = parseAppOrigin('https://shop.example')

describe('ProductServerService', () => {
  it('matches the browser home key and stale time', () => {
    const browser = new ProductService().getHome({ scenario: 'slow' })
    const server = new ProductServerService().getHome(
      { scenario: 'slow' },
      origin,
    )

    expect(server.queryKey).toEqual(browser.queryKey)
    expect(server.staleTime).toBe(60_000)
  })

  it('uses the canonical key and stale time without browser presentation policy', () => {
    const browser = new ProductService().getProductList(request)
    const server = new ProductServerService().getProductList(request, origin)

    expect(server.queryKey).toEqual(browser.queryKey)
    expect(server.staleTime).toBe(browser.staleTime)
    expect(server.placeholderData).toBeUndefined()
    expect(server.throwOnError).toBeUndefined()
  })

  it('forwards request and origin without a query signal', async () => {
    const repository = new ProductServerRepository()
    const getProductList = vi
      .spyOn(repository, 'getProductList')
      .mockResolvedValue({
        products: [],
        categories: [],
        totalCount: 0,
        page: 1,
        pageSize: 12,
      })
    const queryClient = new QueryClient()

    await queryClient.fetchQuery(
      new ProductServerService(repository).getProductList(request, origin),
    )

    expect(getProductList).toHaveBeenCalledWith(request, origin)
  })
})
