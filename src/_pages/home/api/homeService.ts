import type { CategoryId } from '@/entities/product/model/types';
import type { HomeResponse } from './types';
import { categories, homeBanner, products } from '@/entities/product/api/commerce';

export function getHomeData(): HomeResponse {
  const popularProducts = [...products]
    .sort((a, b) => b.reviewCount - a.reviewCount || b.rating - a.rating)
    .slice(0, 6);

  const newProducts = [...products]
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, 6);

  const categoryThumbnails = Object.fromEntries(
    categories.map((cat) => [
      cat.id,
      products.find((p) => p.category === cat.id)?.image ?? '',
    ]),
  ) as Record<CategoryId, string>;

  return {
    banner: homeBanner,
    categories,
    categoryThumbnails,
    popularProducts,
    newProducts,
  };
}
