import { queryOptions } from "@tanstack/react-query";

import type { Category, Product } from "@/entities/product/model/types";
import { fetchJson } from "@/shared/api/fetcher";
import { readMockScenario, withScenario } from "@/shared/api/mockScenario";

export type HomeResponse = {
  banner: { title: string; description: string; image: string };
  categories: Category[];
  popularProducts: Product[];
  newProducts: Product[];
};

// 홈 배너·카테고리·인기·신상품은 머천다이징 값이라 세션 중 거의 변하지 않는다.
// staleTime을 길게 둬 화면을 오가도 재요청하지 않는다.
const HOME_STALE_TIME = 1000 * 60 * 5;

export function homeQueryOptions() {
  const scenario = readMockScenario();

  return queryOptions({
    // 플래그가 꺼진 평소엔 key를 그대로 두어 기존 캐시 계약을 지키고,
    // slow 등 시나리오가 켜졌을 때만 scenario를 key에 더한다.
    queryKey: scenario ? (["home", scenario] as const) : (["home"] as const),
    queryFn: () => fetchJson<HomeResponse>(withScenario("/api/home", scenario)),
    staleTime: HOME_STALE_TIME,
  });
}
