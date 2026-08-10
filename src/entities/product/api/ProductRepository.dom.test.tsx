import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import type { HomeResponse } from '@/entities/product/model/types'

import { server } from '../../../../tests/setup/mswServer'
import { ProductRepository } from './ProductRepository'

const homeFixture = {
  banner: {
    title: '테스트 배너',
    description: '독립된 홈 응답 fixture',
    image: '/images/test-banner.webp',
  },
  categories: [{ id: 'digital', name: '디지털' }],
  popularProducts: [
    {
      id: 'product-popular-1',
      brand: 'Loopers',
      name: '테스트 헤드폰',
      category: 'digital',
      price: 129_000,
      originalPrice: 159_000,
      image: '/images/test-headphones.webp',
      freeShipping: true,
      sizes: [{ value: 1, stock: 7 }],
      rating: 4.8,
      reviewCount: 42,
      createdAt: '2026-08-10T00:00:00.000Z',
    },
  ],
  newProducts: [],
} satisfies HomeResponse

describe('ProductRepository in the browser environment', () => {
  it('parses the home response received through the real default apiClient', async () => {
    server.use(
      http.get('http://localhost:3000/api/home', ({ request }) => {
        expect(request.url).toBe('http://localhost:3000/api/home')
        return HttpResponse.json(homeFixture)
      }),
    )

    const response = await new ProductRepository().getHome({})

    expect(response.banner.title).toBe('테스트 배너')
    expect(response.popularProducts[0]).toEqual(
      expect.objectContaining({
        id: 'product-popular-1',
        price: 129_000,
        freeShipping: true,
      }),
    )
  })
})
