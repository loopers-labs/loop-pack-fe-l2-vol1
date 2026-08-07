import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'

import type { DiagnosticScenario } from '@/entities/product/model/DiagnosticScenario'
import { ProductListRequestModel } from '@/entities/product/model/ProductListRequest'
import { ProductQueryKeyFactory } from '@/entities/product/model/ProductQueryKeyFactory'

import { ProductRepository } from './ProductRepository'
import { ProductService } from './ProductService'

const scenarioCases = [
  {},
  { scenario: 'slow' },
  { scenario: 'empty' },
  { scenario: 'error' },
] as const satisfies ReadonlyArray<DiagnosticScenario>
const baseRequest = ProductListRequestModel.normalize({})

describe('ProductService query keys', () => {
  it.each(scenarioCases)(
    'contains the home diagnostic scenario descriptor',
    (diagnosticScenario) => {
      expect(ProductQueryKeyFactory.home(diagnosticScenario)).toEqual([
        'home',
        diagnosticScenario,
      ])
    },
  )

  it('uses the canonical product request key', () => {
    expect(ProductQueryKeyFactory.productList(baseRequest)).toEqual([
      'products',
      'list',
      baseRequest,
    ])
  })
})

describe('ProductService query functions', () => {
  it.each(scenarioCases)(
    'forwards the home diagnostic descriptor to the repository',
    async (diagnosticScenario) => {
      const repository = new ProductRepository()
      const getHome = vi.spyOn(repository, 'getHome').mockResolvedValue({
        banner: {
          title: 'title',
          description: 'description',
          image: '/hero.jpg',
        },
        categories: [],
        popularProducts: [],
        newProducts: [],
      })
      const queryClient = new QueryClient()

      await queryClient.fetchQuery(
        new ProductService(repository).getHome(diagnosticScenario),
      )

      expect(getHome).toHaveBeenCalledWith(diagnosticScenario)
    },
  )

  it('forwards the canonical request and browser query signal', async () => {
    const repository = new ProductRepository()
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
      new ProductService(repository).getProductList(baseRequest),
    )

    expect(getProductList).toHaveBeenCalledWith(
      baseRequest,
      expect.any(AbortSignal),
    )
  })

  it('keeps previous data and handles browser product errors inline', () => {
    const previousData = {
      products: [],
      categories: [],
      totalCount: 0,
      page: 1,
      pageSize: 12,
    }
    const browserOptions = new ProductService().getProductList(baseRequest)
    const placeholderData = browserOptions.placeholderData

    expect(typeof placeholderData).toBe('function')
    if (typeof placeholderData === 'function') {
      expect(placeholderData(previousData, undefined)).toBe(previousData)
    }
    expect(browserOptions.staleTime).toBe(30_000)
    expect(browserOptions.throwOnError).toBe(false)
  })

  it('does not apply browser presentation policy to home queries', () => {
    const homeOptions = new ProductService().getHome({})

    expect(homeOptions.placeholderData).toBeUndefined()
    expect(homeOptions.throwOnError).toBeUndefined()
  })
})
