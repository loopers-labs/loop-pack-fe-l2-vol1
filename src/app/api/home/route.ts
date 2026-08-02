import { NextRequest, NextResponse } from 'next/server'
import {
  categories,
  homeBanner,
  MOCK_DELAY_MS,
  products,
  SLOW_SCENARIO_DELAY_MS,
  waitForMockApi,
} from '@/app/api/_data/commerce'
import type { MockApiScenario } from '@/app/api/_data/commerce'

const scenarioValues = [
  'empty',
  'error',
  'slow',
] as const satisfies readonly MockApiScenario[]

const isMockApiScenario = (value: string): value is MockApiScenario =>
  scenarioValues.some((scenario) => scenario === value)

export async function GET(request: NextRequest) {
  const scenario = request.nextUrl.searchParams.get('scenario')

  if (scenario !== null && !isMockApiScenario(scenario)) {
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
      { message: '홈 데이터를 불러오지 못했습니다.' },
      { status: 500 },
    )
  }

  const popularProducts = [...products]
    .sort((a, b) => b.reviewCount - a.reviewCount || b.rating - a.rating)
    .slice(0, 6)
  const newProducts = [...products]
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, 6)

  return NextResponse.json({
    banner: homeBanner,
    categories,
    popularProducts: scenario === 'empty' ? [] : popularProducts,
    newProducts: scenario === 'empty' ? [] : newProducts,
  })
}
