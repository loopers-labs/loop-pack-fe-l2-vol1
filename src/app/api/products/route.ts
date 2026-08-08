import { NextRequest, NextResponse } from 'next/server'
import {
  categories,
  MOCK_DELAY_MS,
  products,
  SLOW_SCENARIO_DELAY_MS,
  waitForMockApi,
} from '@/app/api/_data/commerce'
import {
  isCategoryId,
  isProductSort,
} from '@/entities/product/model/productListContract'
import { parsePositiveInteger } from '@/shared/lib/parsePositiveInteger'
import type { MockApiScenario } from '@/app/api/_data/commerce'

// scenario는 mock API 전용 제어값이라 목록 조건 계약에 넣지 않는다.
const scenarioValues = [
  'empty',
  'error',
  'slow',
] as const satisfies readonly MockApiScenario[]

const isMockApiScenario = (value: string): value is MockApiScenario =>
  scenarioValues.some((scenario) => scenario === value)

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const scenario = params.get('scenario')
  const q = params.get('q')?.trim().toLocaleLowerCase('ko') ?? ''
  const category = params.get('category')
  const sort = params.get('sort')
  const page = parsePositiveInteger(params.get('page') ?? '1')
  const pageSize = parsePositiveInteger(params.get('pageSize') ?? '12', {
    max: 24,
  })

  // 검증은 지연 이전에 끝낸다. 잘못된 요청은 scenario보다 먼저 400으로 거절한다.
  // 조건을 한 식에 모아 page와 pageSize가 이 블록 뒤에서 number로 좁혀지게 한다.
  if (
    (scenario !== null && !isMockApiScenario(scenario)) ||
    (sort !== null && !isProductSort(sort)) ||
    (category !== null && category !== 'all' && !isCategoryId(category)) ||
    page === null ||
    pageSize === null
  ) {
    return NextResponse.json(
      { message: '요청 조건을 확인해주세요.' },
      { status: 400 },
    )
  }

  // slow는 정상과 같은 응답을 더 늦게 준다. 응답 본문은 갈라지지 않는다.
  await waitForMockApi(
    scenario === 'slow' ? SLOW_SCENARIO_DELAY_MS : MOCK_DELAY_MS,
  )

  if (scenario === 'error') {
    return NextResponse.json(
      { message: '상품 목록을 불러오지 못했습니다.' },
      { status: 500 },
    )
  }

  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      category === null || category === 'all' || product.category === category
    const searchable = `${product.brand} ${product.name}`.toLocaleLowerCase(
      'ko',
    )
    return matchesCategory && searchable.includes(q)
  })

  const sortedProducts = [...filteredProducts]

  if (sort !== null) {
    sortedProducts.sort((a, b) => {
      switch (sort) {
        case 'popular':
          return b.reviewCount - a.reviewCount || b.rating - a.rating
        case 'price-asc':
          return a.price - b.price
        case 'price-desc':
          return b.price - a.price
        case 'latest':
          return Date.parse(b.createdAt) - Date.parse(a.createdAt)
      }
    })
  }

  const start = (page - 1) * pageSize
  const pagedProducts = sortedProducts.slice(start, start + pageSize)
  const responseProducts = scenario === 'empty' ? [] : pagedProducts
  const totalCount = scenario === 'empty' ? 0 : filteredProducts.length

  return NextResponse.json({
    products: responseProducts,
    categories,
    totalCount,
    page,
    pageSize,
  })
}
