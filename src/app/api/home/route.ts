import { NextRequest, NextResponse } from 'next/server'
import {
  MOCK_DELAY_MS,
  SLOW_SCENARIO_DELAY_MS,
  waitForMockApi,
} from '@/app/api/_data/commerce'
import { selectHome } from '@/app/api/_data/selectHome'
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

  // 응답을 만드는 규칙은 selectHome 하나가 소유한다. 테스트의 mock 서버도 같은 것을 쓴다.
  const home = selectHome()

  return NextResponse.json({
    ...home,
    popularProducts: scenario === 'empty' ? [] : home.popularProducts,
    newProducts: scenario === 'empty' ? [] : home.newProducts,
  })
}
