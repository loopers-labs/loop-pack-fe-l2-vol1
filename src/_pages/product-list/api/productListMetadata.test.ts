import { HttpResponse, http } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { SearchParams } from 'nuqs/server'
import { server } from '@/test/msw/server'
import type { Product } from '@/entities/product/model/product'
import { generateProductListMetadata } from './productListMetadata'
import type { ProductListResponse } from './productList'

// 문구가 실제 응답을 따라야 한다. 문장 구조는 화면과 공유하지만
// 카테고리 이름은 응답을 따르므로 화면의 고정 영문명과 다를 수 있다.
// 실패마다 화면이 달라져야 한다. 예상 가능한 조회 실패는 root metadata를 살리고,
// 예상 밖 오류는 숨기지 않는다.

const makeProduct = (id: string): Product => ({
  id,
  brand: '브랜드',
  name: `상품${id}`,
  category: 'goods',
  price: 10000,
  originalPrice: null,
  image: `/images/products/${id}.jpg`,
  freeShipping: false,
  sizes: [],
  rating: 4.5,
  reviewCount: 10,
  createdAt: '2026-07-01T00:00:00.000Z',
})

const listResponse = (
  overrides: Partial<ProductListResponse> = {},
): ProductListResponse => ({
  products: [makeProduct('p1')],
  categories: [{ id: 'goods', name: '뷰티 잡화' }],
  totalCount: 30,
  page: 1,
  pageSize: 12,
  ...overrides,
})

// 조회는 GET URL을 키로 요청 범위를 공유한다. 사례마다 다른 origin을 써서
// 어떤 응답이 어느 사례의 것인지 흐려지지 않게 한다.
// 응답은 MSW가 네트워크에서 만든다. fetch를 바꿔치기하면 서버가 실제로 요청을
// 내보내는지, 상태 코드를 어떻게 읽는지가 검증에서 빠진다.
let originSeq = 0
const stubApi = (resolver: Parameters<typeof http.get>[1]) => {
  originSeq += 1
  vi.stubEnv('APP_ORIGIN', `http://products-${originSeq}.test`)
  server.use(http.get('*/api/products', resolver))
}

const stubList = (overrides: Partial<ProductListResponse> = {}) =>
  stubApi(() => HttpResponse.json(listResponse(overrides)))

const metadataFor = (searchParams: SearchParams) =>
  generateProductListMetadata({ searchParams: Promise.resolve(searchParams) })

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('상품 목록 metadata title', () => {
  it('조건이 없으면 화면 제목을 그대로 쓴다', async () => {
    stubList()
    expect(await metadataFor({})).toMatchObject({ title: 'Products' })
  })

  it('검색어가 있으면 title에 먼저 반영한다', async () => {
    stubList()
    expect(await metadataFor({ q: '니트' })).toMatchObject({
      title: 'Search “니트”',
    })
  })

  it('2페이지 이상이면 페이지 번호도 title에 넣는다', async () => {
    stubList()
    expect(await metadataFor({ page: '2' })).toMatchObject({
      title: 'Products (page 2)',
    })

    stubList()
    expect(await metadataFor({ q: '니트', page: '3' })).toMatchObject({
      title: 'Search “니트” (page 3)',
    })
  })
})

describe('상품 목록 metadata description', () => {
  it('전체 개수는 응답의 totalCount를 쓴다', async () => {
    stubList({ totalCount: 7 })
    expect(await metadataFor({})).toMatchObject({ description: '7 products.' })
  })

  it('카테고리 이름은 정적 목록이 아니라 같은 응답에서 찾는다', async () => {
    // 서버가 표시명을 바꾸면 본문과 공유 카드가 함께 바뀌어야 한다.
    stubList({ categories: [{ id: 'goods', name: '서버가 바꾼 이름' }] })
    expect(
      await metadataFor({ category: 'goods', sort: 'popular' }),
    ).toMatchObject({
      description: '30 products in 서버가 바꾼 이름, sorted by Popular.',
    })
  })

  it('응답에 선택 category가 없으면 storefront 이름으로 축퇴한다', async () => {
    // 계약이 어긋난 경우다. 문장을 비우거나 id를 노출하지 않는다.
    stubList({ categories: [] })
    expect(await metadataFor({ category: 'goods' })).toMatchObject({
      description: '30 products in Beauty & Goods.',
    })
  })

  it('정상 empty는 조건과 0건을 설명한다', async () => {
    stubList({ products: [], totalCount: 0 })
    expect(await metadataFor({ q: '니트', category: 'goods' })).toMatchObject({
      description: 'No products match “니트” in 뷰티 잡화.',
    })
  })
})

describe('상품 목록 Open Graph', () => {
  it('첫 상품 이미지를 공유 카드에 쓴다', async () => {
    stubList({ products: [makeProduct('p9'), makeProduct('p1')] })
    expect((await metadataFor({})).openGraph).toMatchObject({
      images: ['/images/products/p9.jpg'],
    })
  })

  it('보여줄 상품이 없으면 공통 fallback 이미지를 남긴다', async () => {
    stubList({ products: [], totalCount: 0 })
    expect((await metadataFor({})).openGraph).toMatchObject({
      images: ['/images/products/p6.jpg'],
      siteName: 'Loop Market',
      locale: 'ko_KR',
      type: 'website',
    })
  })
})

describe('상품 목록 metadata 실패 정책', () => {
  it('재현용 scenario는 문구에 드러내지 않는다', async () => {
    stubList()
    const metadata = await metadataFor({ scenario: 'slow' })
    expect(metadata).toMatchObject({ title: 'Products' })
    expect(JSON.stringify(metadata)).not.toContain('slow')
  })

  it('예상 가능한 조회 실패는 아무 필드도 정하지 않아 root를 상속한다', async () => {
    stubApi(() => new HttpResponse(null, { status: 500 }))
    expect(await metadataFor({})).toEqual({})
  })

  it('요청이 나가지 못한 실패도 root를 상속한다', async () => {
    stubApi(() => HttpResponse.error())
    expect(await metadataFor({})).toEqual({})
  })

  it('예상 밖 오류는 삼키지 않는다', async () => {
    // 200인데 본문이 JSON이 아니다. 계약이 깨진 것이라 화면이 복구 방법을 모른다.
    stubApi(() => new HttpResponse('<html>'))
    await expect(metadataFor({})).rejects.toThrow()
  })
})
