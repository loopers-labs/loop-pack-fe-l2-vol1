import { describe, expect, it } from 'vitest'
import type { Product, ProductListResponse } from '@/entities/product'
import { OPEN_GRAPH_FALLBACK_IMAGE } from '@/shared/config/siteMetadata'
import { buildProductListMetadata } from './buildProductListMetadata'

const PRODUCT = {
  id: 'p1',
  brand: 'Loopers',
  name: '니트',
  category: 'fashion',
  price: 10000,
  originalPrice: null,
  image: '/images/products/p1.jpg',
  freeShipping: false,
  sizes: [],
  rating: 5,
  reviewCount: 1,
  createdAt: '2026-01-01',
} satisfies Product

const RESPONSE = {
  products: [PRODUCT],
  categories: [
    { id: 'fashion', name: '패션' },
    { id: 'digital', name: '디지털' },
  ],
  totalCount: 6,
  page: 1,
  pageSize: 12,
} satisfies ProductListResponse

describe('상품 목록 metadata', () => {
  it('검색어를 title에 우선하고 페이지 번호와 목록 응답 정보를 반영한다', () => {
    const metadata = buildProductListMetadata(
      {
        q: '니트',
        category: 'fashion',
        sort: 'price-desc',
        page: 2,
        pageSize: 12,
        scenario: null,
      },
      RESPONSE,
    )

    expect(metadata.title).toBe('“니트” 검색 결과 2페이지')
    expect(metadata.description).toBe(
      '카테고리 패션 · 정렬 높은 가격순 · 상품 6개',
    )
    expect(metadata.openGraph).toMatchObject({
      siteName: 'Loopers',
      locale: 'ko_KR',
      type: 'website',
      images: ['/images/products/p1.jpg'],
    })
  })

  it('정상 empty는 0건을 설명하고 Open Graph fallback image를 유지한다', () => {
    const metadata = buildProductListMetadata(
      {
        q: '',
        category: 'digital',
        sort: 'latest',
        page: 1,
        pageSize: 12,
        scenario: 'empty',
      },
      { ...RESPONSE, products: [], totalCount: 0 },
    )

    expect(metadata.title).toBe('디지털 상품')
    expect(metadata.description).toBe(
      '카테고리 디지털 · 정렬 최신순 · 상품 0개',
    )
    expect(metadata.openGraph).toMatchObject({
      images: [OPEN_GRAPH_FALLBACK_IMAGE],
    })
  })
})
