import type { HomeResponse } from '@/types/commerce';
import { categories, homeBanner, products } from './commerce';

export function getHomeData(): HomeResponse {
  const popularProducts = [...products]
    .sort((a, b) => b.reviewCount - a.reviewCount || b.rating - a.rating)
    .slice(0, 6);

  const newProducts = [...products]
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, 6);

  return {
    banner: homeBanner,
    categories,
    popularProducts,
    newProducts,
  };
}
