import { NextRequest, NextResponse } from 'next/server';
import { categories, homeBanner, products, waitForMockApi } from '@/app/api/_data/commerce';
import { isMockApiScenario } from '@/types/commerce';
import type { ApiErrorResponse, HomeResponse } from '@/types/commerce';

export const GET = async (
  request: NextRequest
): Promise<NextResponse<HomeResponse | ApiErrorResponse>> => {
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
    .slice(0, 6);
  const newProducts = [...products]
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, 6);

  return NextResponse.json({
    banner: homeBanner,
    categories,
    popularProducts: scenario === 'empty' ? [] : popularProducts,
    newProducts: scenario === 'empty' ? [] : newProducts,
  });
};
