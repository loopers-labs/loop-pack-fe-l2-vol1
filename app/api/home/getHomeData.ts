// AI 생성: route.ts의 데이터 계산 로직을 순수 함수로 분리(테스트 용이성).
// scenario 유효성 검증과 목업 지연(waitForMockApi)은 HTTP 경계인 route.ts 책임으로 남긴다.
import { categories, homeBanner, products } from '../_data/commerce';
import type { MockApiScenario } from '../_data/commerce';
import type { HomeResponse } from '@/_pages/home';

export function getHomeData(scenario?: MockApiScenario | null): HomeResponse {
  const popularProducts = [...products].sort((a, b) => b.reviewCount - a.reviewCount || b.rating - a.rating).slice(0, 6);
  const newProducts = [...products].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).slice(0, 6);

  return {
    banner: homeBanner,
    categories,
    popularProducts: scenario === 'empty' ? [] : popularProducts,
    newProducts: scenario === 'empty' ? [] : newProducts
  };
}
