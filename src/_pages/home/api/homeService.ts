import type { CategoryId } from '@/entities/product/model/types';
import type { HomeResponse } from './types';
import { categories, homeBanner, products } from '@/entities/product/api/commerce';

function getApiBase(): string {
  return typeof window === 'undefined' ? (process.env.APP_ORIGIN ?? '') : '';
}

export async function fetchHomeData(options?: {
  signal?: AbortSignal;
}): Promise<HomeResponse> {
  const res = await fetch(`${getApiBase()}/api/home`, {
    signal: options?.signal,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { message?: string }).message ??
        '홈 데이터를 불러오지 못했습니다.',
    );
  }

  return res.json() as Promise<HomeResponse>;
}

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
