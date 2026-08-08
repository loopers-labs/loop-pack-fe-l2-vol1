import type { CategoryId, ProductSort } from '@/entities/product';

export const CATEGORY_OPTIONS = ['all', 'casual', 'fashion', 'goods', 'home', 'digital'] as const satisfies readonly (CategoryId | 'all')[];
export const SORT_OPTIONS = ['latest', 'popular', 'price-asc', 'price-desc'] as const satisfies readonly ProductSort[];
export const PRODUCT_PAGE_SIZE = 12;
export const FIRST_PAGE = 1;

// AI 생성: week-07 3단계 — 원래 ui/ProductListSection.tsx 안에 로컬로 있었으나, generateProductListMetadata(api
// 레이어)도 같은 라벨이 필요해 ui가 api를 가리키는 역방향 import를 피하려고 model로 올렸다. 설계 문서에
// 옵션 라벨 맵이 없어 직접 정의한다.
export const SORT_LABELS: Record<(typeof SORT_OPTIONS)[number], string> = {
  latest: '최신순',
  popular: '인기순',
  'price-asc': '가격 낮은순',
  'price-desc': '가격 높은순'
};
