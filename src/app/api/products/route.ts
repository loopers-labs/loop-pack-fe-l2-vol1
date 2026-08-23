import { NextRequest, NextResponse } from 'next/server'
import {
  MOCK_DELAY_MS,
  SLOW_SCENARIO_DELAY_MS,
  categories,
  waitForMockApi,
} from '@/app/api/_data/commerce'
import { selectProducts } from '@/app/api/_data/selectProducts'
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
  const q = params.get('q') ?? ''
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

  // 고르는 규칙은 selectProducts 하나가 소유한다. 테스트의 mock 서버도 같은 것을 쓴다.
  const selection = selectProducts({ q, category, sort, page, pageSize })
  const isEmptyScenario = scenario === 'empty'

  return NextResponse.json({
    products: isEmptyScenario ? [] : selection.products,
    categories,
    totalCount: isEmptyScenario ? 0 : selection.totalCount,
    page,
    pageSize,
  })
}
