import { NextRequest, NextResponse } from 'next/server';
import { waitForMockApi } from '../_data/commerce';
import { getHomeData } from './getHomeData';
import type { MockApiScenario } from '../_data/commerce';
import type { HomeResponse } from '@/_pages/home';
import type { ApiErrorResponse } from '@/shared/api/apiFetch';

const scenarioValues = ['empty', 'error', 'slow'] as const satisfies readonly MockApiScenario[];

const isMockApiScenario = (value: string): value is MockApiScenario => scenarioValues.some((scenario) => scenario === value);

export async function GET(request: NextRequest): Promise<NextResponse<HomeResponse | ApiErrorResponse>> {
  const scenario = request.nextUrl.searchParams.get('scenario');

  if (scenario !== null && !isMockApiScenario(scenario)) {
    return NextResponse.json({ message: '요청 조건을 확인해주세요.' }, { status: 400 });
  }

  await waitForMockApi(scenario);

  if (scenario === 'error') {
    return NextResponse.json({ message: '홈 데이터를 불러오지 못했습니다.' }, { status: 500 });
  }

  return NextResponse.json(getHomeData(scenario));
}
