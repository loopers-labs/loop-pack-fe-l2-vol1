import { categories, homeBanner, products } from "./catalog";
import type { HomeResponse } from "./types";

// 홈 화면 데이터 구성(순수 도메인). scenario 분기는 어댑터(route)가 담당한다.
export function getHomeData(): HomeResponse {
  const popularProducts = [...products]
    .sort((a, b) => b.reviewCount - a.reviewCount || b.rating - a.rating)
    .slice(0, 6);
  const newProducts = [...products]
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, 6);

  return { banner: homeBanner, categories, popularProducts, newProducts };
}
