import { NextResponse } from 'next/server';
import { categories, homeBanner, products, waitForMockApi } from '@/app/api/_data/commerce';
import type { NextRequest } from 'next/server';
import type { ApiErrorResponse, MockApiScenario } from '@/shared/api/response';
import type { HomeResponse } from '@/app/(home)/_api/homeQueryOptions';

const HOME_SECTION_ITEM_LIMIT = 6;

const scenarioValues = ['empty', 'error'] as const satisfies readonly MockApiScenario[];

const isMockApiScenario = (value: string): value is MockApiScenario =>
  scenarioValues.some((scenario) => scenario === value);

export async function GET(
  request: NextRequest,
): Promise<NextResponse<HomeResponse | ApiErrorResponse>> {
  const scenario = request.nextUrl.searchParams.get('scenario');

  if (scenario !== null && !isMockApiScenario(scenario)) {
    return NextResponse.json({ message: '요청 조건을 확인해주세요.' }, { status: 400 });
  }

  await waitForMockApi();

  if (scenario === 'error') {
    return NextResponse.json({ message: '홈 데이터를 불러오지 못했습니다.' }, { status: 500 });
  }

  const popularProducts = [...products]
    .sort((a, b) => b.reviewCount - a.reviewCount || b.rating - a.rating)
    .slice(0, HOME_SECTION_ITEM_LIMIT);
  const newProducts = [...products]
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, HOME_SECTION_ITEM_LIMIT);

  return NextResponse.json({
    banner: homeBanner,
    categories,
    popularProducts: scenario === 'empty' ? [] : popularProducts,
    newProducts: scenario === 'empty' ? [] : newProducts,
  });
}
