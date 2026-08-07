import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { GetProductListResponse } from '@/entities/product'
import { ProductListResults, type ProductListQueryView } from './ProductListResults'

// useProductPagination은 nuqs의 useQueryState를 쓰므로 NuqsAdapter 없이는 렌더할 수 없다.
// 이 테스트가 보는 것은 페이지네이션 계산이 아니라 조회 상태별 분기라 고정값으로 대체한다.
vi.mock('@/_pages/product-list/model/useProductPagination', () => ({
  useProductPagination: (totalCount: number, pageSize: number) => ({
    currentPage: 1,
    totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
    pageSize,
    goToPage: () => {},
  }),
}))

const listResponse = (totalCount: number): GetProductListResponse => ({
  products: [
    {
      id: 'p1',
      brand: '브랜드',
      name: '이전 조건의 상품',
      category: 'casual',
      price: 10000,
      originalPrice: null,
      image: '/images/products/p1.jpg',
      freeShipping: true,
      sizes: [],
      rating: 4.5,
      reviewCount: 10,
      createdAt: '2026-01-01',
    },
  ],
  categories: [{ id: 'casual', name: '캐주얼' }],
  totalCount,
  page: 1,
  pageSize: 12,
})

const queryView = (view: Partial<ProductListQueryView>): ProductListQueryView => ({
  data: undefined,
  isPending: false,
  isError: false,
  isPlaceholderData: false,
  refetch: () => {},
  ...view,
})

describe('ProductListResults', () => {
  it('데이터가 없는 최초 진입에는 skeleton을 보여준다', () => {
    const markup = renderToStaticMarkup(
      <ProductListResults query={queryView({ isPending: true })} fallbackData={undefined} />,
    )

    expect(markup).not.toContain('총 ')
    expect(markup).not.toContain('이전 조건의 상품')
  })

  // 다른 조건의 캐시가 남아 있어도 최초 진입은 최초 진입이다. 여기서 폴백을 그리면
  // 주소창은 새 조건인데 화면은 이전 조건의 목록이고, 로딩 표시도 실패 알림도 없다.
  it('캐시가 남아 있어도 최초 진입이면 이전 목록을 그리지 않는다', () => {
    const markup = renderToStaticMarkup(
      <ProductListResults query={queryView({ isPending: true })} fallbackData={listResponse(6)} />,
    )

    expect(markup).not.toContain('이전 조건의 상품')
    expect(markup).not.toContain('총 6개')
  })

  it('표시할 데이터가 없는 최초 실패에는 목록 대신 실패 이유와 재시도를 보여준다', () => {
    const markup = renderToStaticMarkup(
      <ProductListResults query={queryView({ isError: true })} fallbackData={undefined} />,
    )

    expect(markup).toContain('상품 목록을 불러오지 못했어요.')
    expect(markup).toContain('다시 시도')
    expect(markup).not.toContain('이전 조건의 상품')
  })

  // 개입 5의 계약이다. 갱신 실패는 직전 목록을 남긴 채 실패 사실만 흐름 밖에서 알린다.
  it('표시할 데이터가 있는 갱신 실패에는 직전 목록과 알림을 함께 보여준다', () => {
    const markup = renderToStaticMarkup(
      <ProductListResults query={queryView({ isError: true })} fallbackData={listResponse(6)} />,
    )

    expect(markup).toContain('이전 조건의 상품')
    expect(markup).toContain('아래는 이전 조건의 결과예요')
    expect(markup).toContain('다시 시도')
    // 최초 실패 분기는 목록 자리를 통째로 차지하므로 총 개수가 남아 있으면 그쪽이 아니다.
    expect(markup).toContain('총 6개')
  })
})
