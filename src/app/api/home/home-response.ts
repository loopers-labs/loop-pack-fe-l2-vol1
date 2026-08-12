import { cache } from "react";
import { categories, homeBanner, products, waitForMockApi } from "@/app/api/_data/commerce";
import type { HomeResponse, MockApiScenario } from "@/types/commerce";
import { MockApiError } from "../_contract";

// generateMetadata와 본문 prefetch가 별개 QueryClient로 호출해도
// 요청당 한 번만 실행되도록 React cache로 메모한다
export const getHomeResponse = cache(
  async (scenario: MockApiScenario | null): Promise<HomeResponse> => {
    await waitForMockApi(scenario === "slow" ? 1_500 : 500);

    if (scenario === "error") {
      throw new MockApiError("홈 데이터를 불러오지 못했습니다.", 500);
    }

    const popularProducts = [...products]
      .sort((a, b) => b.reviewCount - a.reviewCount || b.rating - a.rating)
      .slice(0, 6);
    const newProducts = [...products]
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
      .slice(0, 6);

    return {
      banner: homeBanner,
      categories,
      popularProducts: scenario === "empty" ? [] : popularProducts,
      newProducts: scenario === "empty" ? [] : newProducts,
    };
  },
);
