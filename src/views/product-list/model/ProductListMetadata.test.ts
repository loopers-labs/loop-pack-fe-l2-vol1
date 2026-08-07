import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import * as z from 'zod'

import { ProductServerFetchError } from '@/entities/product/api/ProductServerFetchError'
import { ProductListRouteParams } from '@/entities/product/model/ProductListRouteParams'
import type { ProductListResponse } from '@/entities/product/model/types'
import { ApiClientError } from '@/shared/api/ApiClientError'
import { parseAppOrigin } from '@/shared/config/AppOrigin'
import { createResolvingMetadataFixture } from '@/shared/config/ResolvingMetadataFixture.test-helper'

import { buildProductListMetadata } from './ProductListMetadata'

const origin = parseAppOrigin('https://shop.example')
const parent = createResolvingMetadataFixture()

function response(
  products: ProductListResponse['products'],
  totalCount: number,
): ProductListResponse {
  return { products, categories: [], totalCount, page: 2, pageSize: 12 }
}

function build(route: Record<string, string>, data: ProductListResponse) {
  return buildProductListMetadata(
    { origin, request: ProductListRouteParams.toRequest(route), parent },
    {
      getQueryClient: () => new QueryClient(),
      loadProductList: () => Promise.resolve(data),
    },
  )
}

describe('buildProductListMetadata', () => {
  it('prioritizes q, keeps page suffix, canonicalizes, and uses first image', async () => {
    const product: ProductListResponse['products'][number] = {
      id: 'p1',
      name: '상품',
      brand: '브랜드',
      category: 'home',
      price: 1000,
      originalPrice: null,
      image: '/product.jpg',
      freeShipping: true,
      sizes: [],
      rating: 5,
      reviewCount: 1,
      createdAt: '2026-01-01T00:00:00.000Z',
    }

    await expect(
      build(
        { q: 'stanley', category: 'home', sort: 'popular', page: '2' },
        response([product], 13),
      ),
    ).resolves.toMatchObject({
      title: '“stanley” 검색 결과 - 2페이지',
      description: '“stanley” 검색 결과 13개를 인기순으로 확인하세요.',
      alternates: {
        canonical:
          'https://shop.example/products?q=stanley&category=home&sort=popular&page=2',
      },
      openGraph: {
        siteName: 'Loopers Commerce',
        locale: 'ko_KR',
        type: 'website',
        images: [{ url: 'https://shop.example/product.jpg' }],
      },
    })
  })

  it('distinguishes explicit zero results from a positive-total empty page', async () => {
    await expect(build({ q: 'none' }, response([], 0))).resolves.toMatchObject({
      description: '“none” 검색 결과가 0개입니다.',
      openGraph: {
        images: [
          { url: 'https://shop.example/images/week-07/hero-original.jpg' },
        ],
      },
    })
    await expect(
      build({ category: 'home', page: '2' }, response([], 13)),
    ).resolves.toMatchObject({
      title: '홈 상품 - 2페이지',
      description: '전체 13개 중 2페이지에 표시할 상품이 없습니다.',
    })
  })

  it.each([
    new ApiClientError('expected', 503),
    new ProductServerFetchError(new TypeError('fetch failed')),
  ])('returns root inheritance for expected query failure', async (error) => {
    await expect(
      buildProductListMetadata(
        {
          origin,
          request: ProductListRouteParams.toRequest({}),
          parent,
        },
        {
          getQueryClient: () => new QueryClient(),
          loadProductList: () => Promise.reject(error),
        },
      ),
    ).resolves.toEqual({})
  })

  it.each([
    new SyntaxError('malformed'),
    new z.ZodError([]),
    new TypeError('programming error'),
  ])('rethrows unexpected loader failure', async (error) => {
    await expect(
      buildProductListMetadata(
        {
          origin,
          request: ProductListRouteParams.toRequest({}),
          parent,
        },
        {
          getQueryClient: () => new QueryClient(),
          loadProductList: () => Promise.reject(error),
        },
      ),
    ).rejects.toBe(error)
  })
})
